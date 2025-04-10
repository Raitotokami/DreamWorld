// Inizializzazione scena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// Luci base
const ambientLight = new THREE.AmbientLight(0x333333, 0.3);
scene.add(ambientLight);

// Creazione del SOLE con luce potente
const sunTexture = new THREE.TextureLoader().load('https://as2.ftcdn.net/v2/jpg/08/80/39/19/1000_F_880391931_lcPNm6lTbRxZkWZ4wLAMZtQrKtIh9aOg.jpg');
const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ 
    map: sunTexture,
    emissive: 0xffff00,
    emissiveIntensity: 2
});

const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, -200);
scene.add(sun);

// Luce del sole
const sunLight = new THREE.PointLight(0xffffff, 2, 500, 2);
sunLight.position.copy(sun.position);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Creazione dell'effetto glow avanzato attorno al sole
const glowShader = {
    uniforms: {
        viewVector: { type: "v3", value: camera.position },
        sunPosition: { type: "v3", value: sun.position },
        c: { type: "f", value: 0.8 },
        p: { type: "f", value: 2.0 },
        glowColor: { type: "c", value: new THREE.Color(0xe7901b) },
        viewHeight: { type: "f", value: window.innerHeight }
    },
    vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vec3 actual_normal = normalize(normalMatrix * normal);
            intensity = pow(c - dot(actual_normal, normalize(viewVector)), p);
        }
    `,
    fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4(glow, intensity * 0.5);
        }
    `
};

const glowMaterial = new THREE.ShaderMaterial({
    uniforms: glowShader.uniforms,
    vertexShader: glowShader.vertexShader,
    fragmentShader: glowShader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

const glow = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 32), glowMaterial);
glow.position.copy(sun.position);
glow.scale.multiplyScalar(4);
scene.add(glow);

// Aura esterna più ampia
const outerGlowGeometry = new THREE.SphereGeometry(25, 32, 32);
const outerGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
});
const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
outerGlow.position.copy(sun.position);
//scene.add(outerGlow);

// Stelle
const starCount = 10000;
const starsGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    starPositions[i3] = (Math.random() - 0.5) * 2500;
    starPositions[i3 + 1] = (Math.random() - 0.5) * 2500;
    starPositions[i3 + 2] = (Math.random() - 0.5) * 2500;
    
    // Colori casuali (inclinati verso bianco/blu/rosso)
    const colorType = Math.random();
    if (colorType < 0.7) {
        // Stelle bianche/gialle
        starColors[i3] = Math.random() * 0.5 + 0.5;
        starColors[i3 + 1] = Math.random() * 0.5 + 0.5;
        starColors[i3 + 2] = Math.random() * 0.3 + 0.2;
    } else if (colorType < 0.9) {
        // Stelle blu
        starColors[i3] = Math.random() * 0.2;
        starColors[i3 + 1] = Math.random() * 0.2;
        starColors[i3 + 2] = Math.random() * 0.5 + 0.5;
    } else {
        // Stelle rosse
        starColors[i3] = Math.random() * 0.5 + 0.5;
        starColors[i3 + 1] = Math.random() * 0.2;
        starColors[i3 + 2] = Math.random() * 0.2;
    }
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starsMaterial = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
});

const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Texture dei pianeti
const planetTextures = {
    earth: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    mars: 'https://threejs.org/examples/textures/planets/mars_2048.jpg',
    jupiter: 'https://threejs.org/examples/textures/planets/jupiter_2048.jpg',
    saturn: 'https://threejs.org/examples/textures/planets/saturn_2048.jpg',
    neptune: 'https://threejs.org/examples/textures/planets/neptune_2048.jpg',
    uranus: 'https://threejs.org/examples/textures/planets/uranus_2048.jpg'
};

let planets = [];
let planetId = 0;

function createPlanet(type, size, position) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const texture = new THREE.TextureLoader().load(planetTextures[type]);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.8,
        metalness: 0.2,
        shadowSide: THREE.DoubleSide
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(position.x, position.y, position.z);
    planet.castShadow = true;
    planet.receiveShadow = true;

    if (type === 'saturn') {
        const ringGeometry = new THREE.RingGeometry(size * 1.2, size * 1.5, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xddddbb,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        rings.castShadow = true;
        planet.add(rings);
    }

    const planetData = {
        id: planetId++,
        mesh: planet,
        type: type,
        size: size,
        rotationSpeed: (Math.random() * 0.005) + 0.001
    };

    scene.add(planet);
    planets.push(planetData);
    updatePlanetUI();
    return planetData;
}

// UI Events
document.getElementById('createPlanet').addEventListener('click', () => {
    const type = document.getElementById('planetType').value;
    const size = parseFloat(document.getElementById('planetSize').value);
    
    const position = {
        x: (Math.random() * 300) - 150,
        y: (Math.random() * 100) - 50,
        z: (Math.random() * -300) - 100
    };
    
    createPlanet(type, size, position);
});

document.getElementById('clearAll').addEventListener('click', () => {
    planets.forEach(planet => {
        scene.remove(planet.mesh);
    });
    planets = [];
    updatePlanetUI();
});

function updatePlanetUI() {
    document.getElementById('planetCount').textContent = planets.length;
    const planetList = document.getElementById('planetList');
    planetList.innerHTML = '';
    
    planets.forEach(planet => {
        const div = document.createElement('div');
        div.innerHTML = `Pianeta #${planet.id}: ${planet.type} (${planet.size.toFixed(1)}u)`;
        planetList.appendChild(div);
    });
}

// Camera e controlli
camera.position.set(0, 50, 200);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.minDistance = 50;
controls.maxDistance = 1000;

// Animazione stelle
function animateStars() {
    const positions = starsGeometry.attributes.position.array;
    const colors = starsGeometry.attributes.color.array;
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        
        if (Math.random() > 0.99) {
            const colorChange = Math.random();
            if (colorChange < 0.7) {
                // Scintillio bianco/giallo
                colors[i3] = 1;
                colors[i3 + 1] = 1;
                colors[i3 + 2] = Math.random() * 0.5 + 0.5;
            } else if (colorChange < 0.85) {
                // Scintillio blu
                colors[i3] = Math.random() * 0.2;
                colors[i3 + 1] = Math.random() * 0.2;
                colors[i3 + 2] = 1;
            } else {
                // Scintillio rosso
                colors[i3] = 1;
                colors[i3 + 1] = Math.random() * 0.2;
                colors[i3 + 2] = Math.random() * 0.2;
            }
        }
    }
    
    starsGeometry.attributes.color.needsUpdate = true;
}

// Aggiorna l'uniform dello shader quando la camera si muove
function updateGlow() {
    glowMaterial.uniforms.viewVector.value = 
        new THREE.Vector3().subVectors(camera.position, glow.position);
}

// Animazione principale
function animate() {
    requestAnimationFrame(animate);
    
    // Rotazione pianeti
    planets.forEach(planet => {
        planet.mesh.rotation.y += planet.rotationSpeed;
    });
    
    // Rotazione sole
    sun.rotation.y += 0.001;
    
    // Aggiorna l'effetto glow
    updateGlow();
    
    // Animazione stelle
    animateStars();
    
    controls.update();
    renderer.render(scene, camera);
}

// Gestione resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    glowMaterial.uniforms.viewHeight.value = window.innerHeight;
});

animate();