document.body.onload = createNavBar;

async function createNavBar() {
    const navbarInnerHTML = /* HTML */ `
        <div id="nav-bar-items-container">
            <div class="nav-bar-item">
                <a href="index.html">Train AI Mario! <img src="img/mario.png" style="height: 1.1em; margin-bottom: -3px"> </a></div>
            <div class="nav-bar-item">
                <a href="draw.html">Map Editor <img src="img/map.png" style="height: 1em; margin-bottom: -3px"> </a></div>
        </div>
    `;

    const targetDiv = document.querySelector(".navbar");
    targetDiv.innerHTML = navbarInnerHTML;
}