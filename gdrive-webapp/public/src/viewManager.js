export default class ViewManager {
  constructor() {
    this.tbody = document.getElementById("tbody");
    this.newFileBtn = document.getElementById("newFileBtn");
    this.fileElem = document.getElementById("fileElem");
    this.progressModal = document.getElementById("progressModal");
    this.progressBar = document.getElementById("progressBar");
    this.output = document.getElementById("output");

    this.modalInstance = {};

    this.formatter = new Intl.DateTimeFormat("pt", {
      locale: "pt-br",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  configureModal() {
    this.modalInstance = M.Modal.init(this.progressModal, {
      opacity: 0,
      dissmissable: false,
      onOpenEnd() {
        this.$overlay[0].remove();
      },
    });
  }

  updateStatus(size) {
    this.output.innerHTML = `Uploading in <b>${Math.floor(size)}%</b>`;
    this.progressBar.value = size;
  }

  closeModal() {
    this.modalInstance.close();
  }

  openModal() {
    this.modalInstance.open();
  }

  configureOnFileChange(fn) {
    this.fileElem.onchange = (e) => fn(e.target.files);
  }

  configureFileBtnClick() {
    this.newFileBtn.onclick = () => this.fileElem.click();
  }

  getIcon(file) {
    return file.match(/\.mp4/i) ? "movie" : file.match(/\.jp|png/i) ? "image" : "content_copy";
  }

  makeIcon(file) {
    const icon = this.getIcon(file);
    const colors = {
      image: "yellow600",
      movie: "red600",
      file: "",
    };

    return `<i class="material-icons ${colors[icon]} left">${icon}</i>`;
  }

  updateCurrentFiles(files) {
    const template = ({ size, file, lastModified, owner }) => `
    <tr>
      <td>${this.makeIcon(file)} ${file}</td>
      <td>${owner}</td>
      <td>${this.formatter.format(new Date(lastModified))}</td>
      <td>${size}</td>
    </tr>
    `;

    this.tbody.innerHTML = files.map(template).join("");
  }
}