marked.use({ breaks: true });

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.');
    document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

let base64Image = null;
let mimeType = null;
let isDeepThink = false; // Status mode AI (Flash/Pro)

const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-upload');
const fileIndicator = document.getElementById('file-indicator');

// --- LOGIKA MENU MODEL ---
const modelBtn = document.getElementById('model-selector-btn');
const modelDropdown = document.getElementById('model-dropdown');
const modelOptions = document.querySelectorAll('.model-option');

modelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modelDropdown.classList.toggle('show');
});

// Menutup menu jika klik di luar
document.addEventListener('click', () => {
    modelDropdown.classList.remove('show');
});

modelOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Hapus class active dari semua opsi
        modelOptions.forEach(opt => opt.classList.remove('active'));
        // Tambahkan ke yang dipilih
        option.classList.add('active');
        
        // Update state
        isDeepThink = option.getAttribute('data-value') === 'true';
        
        // Update teks tombol
        if(isDeepThink) {
            modelBtn.innerHTML = "✨ Pro";
        } else {
            modelBtn.innerHTML = "⚡ Flash";
        }
    });
});
// -------------------------

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            base64Image = event.target.result.split(',')[1]; 
            mimeType = file.type;
            fileIndicator.textContent = `[ IMG: ${file.name.substring(0, 8)}... ]`;
        };
        reader.readAsDataURL(file);
    }
});

function appendMessage(sender, text, imgData = null) {
    const div = document.createElement('div');
    div.classList.add('message', sender, 'fade-in');
    
    let content = '';
    
    if (imgData) {
        content += `<img src="data:${mimeType};base64,${imgData}" class="img-preview"><br>`;
    }
    
    if (sender === 'system') {
        content += text.replace(/\n/g, '<br>');
    } else {
        content += marked.parse(text);
    }
    
    div.innerHTML = content;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (window.MathJax) {
        MathJax.typesetPromise([div]).catch((err) => console.log('MathJax Error:', err));
    }
}

async function sendMessage() {
    const text = inputField.value.trim();
    if (!text && !base64Image) return;

    const payload = {
        text: text,
        image: base64Image,
        mimeType: mimeType,
        deepThink: isDeepThink
    };

    appendMessage('user', text, base64Image);
    inputField.value = '';
    fileIndicator.textContent = "";
    base64Image = null;
    mimeType = null;
    imageInput.value = '';

    inputField.disabled = true;
    sendBtn.disabled = true;
    
    // Tampilkan Animasi Loading Titik-Titik
    const loadingId = "loading-" + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'ai', 'fade-in');
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        document.getElementById(loadingId).remove();
        
        if (data.error) {
            appendMessage('system', `[API_ERROR] ${data.error}`);
        } else {
            appendMessage('ai', data.reply);
        }
    } catch (err) {
        if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        appendMessage('system', `[SYS_FAIL] Jaringan terputus.`);
    } finally {
        inputField.disabled = false;
        sendBtn.disabled = false;
        // inputField.focus(); -> DIHAPUS agar keyboard HP tidak otomatis naik menutupi layar setelah AI membalas.
    }
}

sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
