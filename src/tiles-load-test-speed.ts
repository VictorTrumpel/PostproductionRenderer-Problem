import Stats from "stats.js";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

(async () => {
  const container = document.createElement("div");
  container.classList.add("ifc-div-container");
  document.body.append(container);

  const components = new OBC.Components();

  const worlds = components.get(OBC.Worlds);

  const world = worlds.create<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBCF.PostproductionRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBCF.PostproductionRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);

  components.init();

  world.scene.setup();

  world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

  const grids = components.get(OBC.Grids);
  const grid = grids.create(world);

  const { postproduction } = world.renderer;
  postproduction.enabled = true;
  postproduction.customEffects.excludedMeshes.push(grid.three);
  const ao = postproduction.n8ao.configuration;

  const loader = components.get(OBCF.IfcStreamer);
  loader.world = world;

  loader.url = "http://localhost:5173/berezin-tiles/";

  async function loadModel(geometryURL: string, propertiesURL?: string) {
    const rawGeometryData = await fetch(geometryURL);
    const geometryData = await rawGeometryData.json();
    let propertiesData;
    if (propertiesURL) {
      const rawPropertiesData = await fetch(propertiesURL);
      propertiesData = await rawPropertiesData.json();
    }

    const model = await loader.load(geometryData, true, propertiesData);
    console.log(model);
  }

  loadModel("http://localhost:5173/berezin-tiles/small.ifc-processed.json");
  loadModel("http://localhost:5173/berezin-tiles/ber2.ifc-processed.json");
  loadModel("http://localhost:5173/berezin-tiles/ber3.ifc-processed.json");

  world.camera.controls.addEventListener("sleep", () => {
    loader.culler.needsUpdate = true;
  });
})();

(async () => {
  const components = new OBC.Components();

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
    const bufferFileName = `${inputFileName.value}-processed-geometries-${geometryFilesCount}`;
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
      name: `${inputFileName.value}-processed-global`,
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
        globalDataFileId: `${inputFileName.value}-processed-global`,
      };
      files.push({
        name: `${inputFileName.value}-processed.json`,
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
    const fetchedIfc = await fetch(inputFilePath.value);
    const ifcBuffer = await fetchedIfc.arrayBuffer();
    // We will need this information later to also convert the properties
    const ifcArrayBuffer = new Uint8Array(ifcBuffer);
    // This triggers the conversion, so the listeners start to be called
    await tiler.streamFromBuffer(ifcArrayBuffer);
  }

  const inputFilePath = document.createElement("input");
  inputFilePath.placeholder = "Введите путь до файла";
  inputFilePath.name = "filePath";
  inputFilePath.style.position = "absolute";
  inputFilePath.style.width = "200px";
  document.body.append(inputFilePath);

  const inputFileName = document.createElement("input");
  inputFileName.placeholder = "Введите имя файла";
  inputFileName.name = "fileName";
  inputFileName.style.position = "absolute";
  inputFileName.style.width = "200px";
  inputFileName.style.top = "25px";
  document.body.append(inputFileName);

  const submitButton = document.createElement("button");
  submitButton.innerText = "Сделать тайлы";
  submitButton.style.position = "absolute";
  submitButton.style.top = "50px";
  document.body.append(submitButton);

  submitButton.onclick = () => {
    processFile();
  };
})();
