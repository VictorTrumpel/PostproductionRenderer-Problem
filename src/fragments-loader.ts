import * as OBC from "@thatopen/components";
import { FragmentsGroup } from "@thatopen/fragments";

(async () => {
  const container = document.createElement("div");
  container.classList.add("ifc-div-container");
  document.body.append(container);

  const components = new OBC.Components();

  const fileNames = ["test-1.ifc", "test-2.ifc", "test-3.ifc"];
  const fragmentIfcLoader = components.get(OBC.IfcLoader);
  const fragments = components.get(OBC.FragmentsManager);

  await fragmentIfcLoader.setup();

  const button = document.createElement("button");
  button.innerText = "Скачать фрагменты";
  button.style.position = "absolute";
  document.body.append(button);

  button.onclick = async () => {
    for (const fileName of fileNames) {
      const file = await fetch(`/${fileName}`);
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      const model = await fragmentIfcLoader.load(buffer);
      exportFragments(model, fileName);
    }

    function exportFragments(group: FragmentsGroup, fileName: string) {
      const data = fragments.export(group);
      const blob = new Blob([data]);
      const file = new File([blob], `${fileName.split(".")[0]}.frag`);
      download(file);
    }

    function download(file: File) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };
})();
