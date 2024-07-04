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
    OBC.SimpleRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);

  components.init();

  world.scene.setup();

  world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

  const grids = components.get(OBC.Grids);
  grids.create(world);

  const loader = components.get(OBCF.IfcStreamer);
  loader.world = world;

  loader.url = "http://localhost:5173/tiles/";

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

  await loadModel("http://localhost:5173/tiles/small.ifc-processed.json");

  world.camera.controls.addEventListener("sleep", () => {
    loader.culler.needsUpdate = true;
  });
})();
