import Stats from "stats.js";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";

(async () => {
  const container = document.createElement("button");
  container.classList.add("ifc-div-container");
  document.body.append(container);

  const components = new OBC.Components();

  const worlds = components.get(OBC.Worlds);

  const world = worlds.create<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBC.SimpleRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);

  components.init();

  world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

  world.scene.setup();

  const grids = components.get(OBC.Grids);
  grids.create(world);

  world.scene.three.background = null;

  const tiler = components.get(OBC.IfcGeometryTiler);

  const wasm = {
    path: "https://unpkg.com/web-ifc@0.0.55/",
    absolute: true,
  };

  tiler.settings.wasm = wasm;
  tiler.settings.minGeometrySize = 20;
  tiler.settings.minAssetsSize = 1000;

  let files: { name: string; bits: (Uint8Array | string)[] }[] = [];
  let geometriesData: OBC.StreamedGeometries = {};
  let geometryFilesCount = 1;

  tiler.onGeometryStreamed.add((geometry) => {
    const { buffer, data } = geometry;
    const bufferFileName = `small.ifc-processed-geometries-${geometryFilesCount}`;
    for (const expressID in data) {
      const value = data[expressID];
      value.geometryFile = bufferFileName;
      geometriesData[expressID] = value;
    }
    files.push({ name: bufferFileName, bits: [buffer] });
    geometryFilesCount++;
  });

  let assetsData: OBC.StreamedAsset[] = [];

  tiler.onAssetStreamed.add((assets) => {
    assetsData = [...assetsData, ...assets];
  });

  tiler.onIfcLoaded.add((groupBuffer) => {
    files.push({
      name: "small.ifc-processed-global",
      bits: [groupBuffer],
    });
  });

  function downloadFile(name: string, ...bits: (Uint8Array | string)[]) {
    const file = new File(bits, name);
    const anchor = document.createElement("a");
    const url = URL.createObjectURL(file);
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadFilesSequentially(
    fileList: { name: string; bits: (Uint8Array | string)[] }[]
  ) {
    for (const { name, bits } of fileList) {
      downloadFile(name, ...bits);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
  }

  tiler.onProgress.add((progress) => {
    if (progress !== 1) return;
    setTimeout(async () => {
      const processedData = {
        geometries: geometriesData,
        assets: assetsData,
        globalDataFileId: "small.ifc-processed-global",
      };
      files.push({
        name: "small.ifc-processed.json",
        bits: [JSON.stringify(processedData)],
      });
      await downloadFilesSequentially(files);
      assetsData = [];
      geometriesData = {};
      files = [];
      geometryFilesCount = 1;
    });
  });

  async function processFile() {
    const fetchedIfc = await fetch(
      "http://localhost:5173/berezin-tiles/ber1.ifc"
    );
    const ifcBuffer = await fetchedIfc.arrayBuffer();
    // We will need this information later to also convert the properties
    const ifcArrayBuffer = new Uint8Array(ifcBuffer);
    // This triggers the conversion, so the listeners start to be called
    await tiler.streamFromBuffer(ifcArrayBuffer);
  }

  const button = document.createElement("button");
  button.innerText = "Скачать tiles";
  button.style.position = "absolute";
  document.body.append(button);
  button.onclick = () => {
    processFile();
  };
})();
