function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.');
    document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

let base64Image = null;
let mimeType = null;
const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-upload');
const fileIndicator = document.getElementById('file-indicator');
const toggleInput = document.getElementById('deep-think-toggle');

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

async function sendMessage() {
    const text = inputField.value.trim();
    if (!text && !base64Image) return;

    const payload = {
        text: text,
        image: base64Image,
        mimeType: mimeType,
        deepThink: toggleInput.checked
    };

    appendMessage('user', text, base64Image);
    inputField.value = '';
    fileIndicator.textContent = "";
    base64Image = null;
    mimeType = null;
    imageInput.value = '';

    inputField.disabled = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            // Menampilkan error secara rapi tanpa trigger catch
            appendMessage('system', `[API_ERROR] ${data.error}`);
        } else {
            appendMessage('ai', '');
            const aiMessageElement = chatBox.lastElementChild;
            typeWriterEffect(aiMessageElement, data.reply);
        }
    } catch (err) {
        // Ini hanya terpicu jika Vercel mati atau internet HP mati
        appendMessage('system', `[SYS_FAIL] Jaringan terputus atau format server salah.`);
    } finally {
        inputField.disabled = false;
        sendBtn.disabled = false;
        inputField.focus();
    }
}

function typeWriterEffect(element, text) {
    let i = 0;
    element.innerHTML = '';
    const speed = 15; 
    
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
