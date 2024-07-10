import {
  Components,
  SimpleScene,
  PostproductionRenderer,
  SimpleCamera,
  FragmentIfcLoader,
} from "openbim-components";
import * as THREE from "three";

(async () => {
  const container = document.createElement("div");
  container.classList.add("ifc-div-container");
  document.body.append(container);

  const components = new Components();

  const scene = new SimpleScene(components);
  components.scene = scene;

  const renderer = new PostproductionRenderer(components, container);
  components.renderer = renderer;

  const camera = new SimpleCamera(components);
  components.camera = camera;
  camera.controls.setLookAt(
    -11.28190328847281,
    7.994236391860568,
    12.437743947066124,
    2.678323934084071,
    3.495292709896221,
    -2.842170943040401e-14
  );

  const directionalLight = new THREE.DirectionalLight();
  directionalLight.position.set(5, 10, 3);
  directionalLight.intensity = 0.5;
  scene.get().add(directionalLight);

  const ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.5;
  scene.get().add(ambientLight);

  components.init();

  // renderer.postproduction.enabled = true;

  scene.setup();

  const fragmentIfcLoader = new FragmentIfcLoader(components);
  fragmentIfcLoader.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.53/",
    absolute: true,
  };

  async function loadDemoModel() {
    const files = ["test-1", "test-2", "test-3"];

    for (const fileName of files) {
      const response = await fetch(`/${fileName}.ifc`);
      let file = await response.blob();
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      const model = await fragmentIfcLoader.load(buffer);
      scene.get().add(model);
    }
  }

  loadDemoModel();
})();
