// 1. Logika Jam (HH.MM.SS)
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.');
    document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

// 2. Variabel State
let base64Image = null;
let mimeType = null;
const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-upload');
const fileIndicator = document.getElementById('file-indicator');
const toggleInput = document.getElementById('deep-think-toggle');
const toggleText = document.getElementById('toggle-text');

// 3. Toggle Deep Think Text
toggleInput.addEventListener('change', () => {
    toggleText.textContent = toggleInput.checked ? "Deep Think: [ON]" : "Deep Think: [OFF]";
});

// 4. Handle Upload Gambar
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            base64Image = event.target.result.split(',')[1]; 
            mimeType = file.type;
            fileIndicator.textContent = `IMG_LOADED: ${file.name.substring(0, 10)}...`;
            fileIndicator.style.color = "#fff";
        };
        reader.readAsDataURL(file);
    }
});

// 5. Fungsi Cetak Pesan ke UI
function appendMessage(sender, text, imgData = null) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    
    let content = '';
    if (imgData) {
        content += `<img src="data:${mimeType};base64,${imgData}" class="img-preview"><br>`;
    }
    content += text.replace(/\n/g, '<br>');
    
    div.innerHTML = content;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 6. Logika Kirim Pesan & Panggil API Vercel
async function sendMessage() {
    const text = inputField.value.trim();
    if (!text && !base64Image) return;

    // Kumpulkan data
    const payload = {
        text: text,
        image: base64Image,
        mimeType: mimeType,
        deepThink: toggleInput.checked
    };

    // Tampilkan di UI
    appendMessage('user', text, base64Image);
    inputField.value = '';
    fileIndicator.textContent = "NO_FILE";
    fileIndicator.style.color = "#888";
    base64Image = null;
    mimeType = null;
    imageInput.value = '';

    // Disable input sementara loading
    inputField.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "[...]";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            appendMessage('system', `[ERROR] ${data.error}`);
        } else {
            // Efek mesin ketik untuk kesan techy
            appendMessage('ai', '');
            const aiMessageElement = chatBox.lastElementChild;
            typeWriterEffect(aiMessageElement, data.reply);
        }
    } catch (err) {
        appendMessage('system', `[SYS_FAIL] Koneksi ke cloud terputus.`);
    } finally {
        inputField.disabled = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "[EXE]";
        inputField.focus();
    }
}

// 7. Efek Typing
function typeWriterEffect(element, text) {
    let i = 0;
    element.innerHTML = '';
    const speed = 10; // Kecepatan ketik (ms)
    
    function typing() {
        if (i < text.length) {
            let char = text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
            element.innerHTML += char;
            chatBox.scrollTop = chatBox.scrollHeight;
            i++;
            setTimeout(typing, speed);
        }
    }
    typing();
}

sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
