var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// Clase principal para manejar la aplicación
var TwistApp = /** @class */ (function () {
    function TwistApp() {
        this.maxCharacters = 280;
        this.threads = [];
        this.currentUser = "Usuario";
        this.currentThread = null;
        // Inicializar elementos del DOM
        this.textArea = document.getElementById('twist-content');
        this.publishButton = document.getElementById('publish-twist');
        this.charCount = document.getElementById('char-count');
        this.threadsList = document.getElementById('threads-list');
        this.usernameInput = document.getElementById('username-input');
        this.avatarInput = document.getElementById('avatar-input');
        this.twistContainer = document.getElementById('twist-container');
        this.avatarPreview = document.getElementById('avatar-preview');
        // Cargar datos almacenados localmente si existen
        this.loadFromLocalStorage();
        // Configurar event listeners
        this.setupEventListeners();
        // Renderizar hilos existentes
        this.renderThreads();
    }
    TwistApp.prototype.setupEventListeners = function () {
        var _this = this;
        // Evento para contar caracteres al escribir
        this.textArea.addEventListener('input', function () {
            _this.updateCharCount();
        });
        // Evento para publicar un nuevo twist
        this.publishButton.addEventListener('click', function () {
            _this.publishTwistWithAvatar();
        });
        // Evento para detectar "Enter" y publicar (Ctrl+Enter)
        this.textArea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                _this.publishTwistWithAvatar();
            }
        });
        // Evento para actualizar el preview del avatar
        this.avatarInput.addEventListener('input', function () {
            _this.updateAvatarPreview();
        });
        // Evento para actualizar el preview cuando se pierde el foco
        this.avatarInput.addEventListener('blur', function () {
            _this.updateAvatarPreview();
        });
    };
    TwistApp.prototype.updateAvatarPreview = function () {
        var _this = this;
        var avatarUrl = this.avatarInput.value.trim();
        if (avatarUrl) {
            // Verificar si la URL es válida
            var img = new Image();
            img.onload = function () {
                _this.avatarPreview.src = avatarUrl;
            };
            img.onerror = function () {
                _this.avatarPreview.src = "https://via.placeholder.com/80";
            };
            img.src = avatarUrl;
        }
        else {
            this.avatarPreview.src = "";
        }
    };
    TwistApp.prototype.publishTwistWithAvatar = function () {
        var _this = this;
        var text = this.textArea.value.trim();
        var username = this.usernameInput.value.trim() || "Anónimo";
        var avatarUrl = this.avatarInput.value.trim() || "https://via.placeholder.com/80";
        if (text === "")
            return;
        // Crear el twist con avatar
        var twist = document.createElement("div");
        twist.className = "twist";
        var avatar = document.createElement("img");
        avatar.src = avatarUrl;
        avatar.className = "twist-avatar";
        avatar.onerror = function () {
            avatar.src = "https://via.placeholder.com/80";
        };
        var content = document.createElement("div");
        content.className = "twist-content";
        var header = document.createElement("div");
        header.className = "twist-header";
        var user = document.createElement("span");
        user.className = "username";
        user.textContent = username;
        var timestamp = document.createElement("span");
        timestamp.className = "twist-timestamp";
        timestamp.textContent = "Ahora";
        var message = document.createElement("span");
        message.className = "message";
        message.textContent = text;
        // Crear barra de acciones
        var actionsBar = document.createElement("div");
        actionsBar.className = "twist-actions-bar";
        // Botón de responder
        var replyButton = document.createElement("button");
        replyButton.className = "twist-action reply-btn";
        replyButton.innerHTML = "\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n        <path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path>\n      </svg>\n      <span>Responder</span>\n    ";
        // Botón de me gusta
        var likeButton = document.createElement("button");
        likeButton.className = "twist-action like-btn";
        likeButton.innerHTML = "\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n        <path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path>\n      </svg>\n      <span>0</span>\n    ";
        // Event listeners para las acciones
        replyButton.addEventListener('click', function () {
            _this.showReplyForm(twist, twistData);
        });
        likeButton.addEventListener('click', function () {
            _this.toggleLike(twistData, likeButton);
        });
        actionsBar.appendChild(replyButton);
        actionsBar.appendChild(likeButton);
        header.appendChild(user);
        header.appendChild(timestamp);
        content.appendChild(header);
        content.appendChild(message);
        content.appendChild(actionsBar);
        twist.appendChild(avatar);
        twist.appendChild(content);
        // Añadir al contenedor de threads
        this.threadsList.appendChild(twist);
        // Limpiar el textarea después de publicar
        this.textArea.value = "";
        this.updateCharCount();
        // Crear objeto Twist para almacenamiento
        var twistData = {
            id: this.generateId(),
            content: text,
            username: username,
            avatarUrl: avatarUrl,
            timestamp: new Date(),
            likes: 0,
            isLiked: false,
            replies: []
        };
        this.threads.push(twistData);
        this.saveToLocalStorage();
        // Scroll suave hacia el nuevo twist
        twist.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    TwistApp.prototype.updateCharCount = function () {
        var currentLength = this.textArea.value.length;
        var remaining = this.maxCharacters - currentLength;
        this.charCount.textContent = "".concat(remaining);
        // Cambiar color según los caracteres restantes
        if (remaining < 20) {
            this.charCount.style.color = 'var(--error-color)';
            this.charCount.classList.add('limit');
        }
        else if (remaining < 50) {
            this.charCount.style.color = '#ffa726';
            this.charCount.classList.remove('limit');
        }
        else {
            this.charCount.style.color = 'var(--text-secondary)';
            this.charCount.classList.remove('limit');
        }
        // Deshabilitar botón si se excede el límite
        this.publishButton.disabled = remaining < 0 || this.textArea.value.trim() === '';
    };
    TwistApp.prototype.renderThreads = function () {
        var _this = this;
        this.threadsList.innerHTML = '';
        this.threads.forEach(function (twist) {
            var threadElement = _this.createTwistElement(twist);
            _this.threadsList.appendChild(threadElement);
        });
    };
    TwistApp.prototype.createTwistElement = function (twist) {
        var _this = this;
        var twistElement = document.createElement('div');
        twistElement.className = 'twist';
        var avatar = document.createElement('img');
        avatar.src = twist.avatarUrl;
        avatar.className = 'twist-avatar';
        avatar.onerror = function () {
            avatar.src = "https://via.placeholder.com/80";
        };
        var content = document.createElement('div');
        content.className = 'twist-content';
        var header = document.createElement('div');
        header.className = 'twist-header';
        var username = document.createElement('span');
        username.className = 'username';
        username.textContent = twist.username;
        var timestamp = document.createElement('span');
        timestamp.className = 'twist-timestamp';
        timestamp.textContent = this.formatTimestamp(twist.timestamp);
        var message = document.createElement('span');
        message.className = 'message';
        message.textContent = twist.content;
        // Crear barra de acciones
        var actionsBar = document.createElement('div');
        actionsBar.className = 'twist-actions-bar';
        // Botón de responder
        var replyButton = document.createElement('button');
        replyButton.className = 'twist-action reply-btn';
        replyButton.innerHTML = "\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n        <path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path>\n      </svg>\n      <span>Responder</span>\n    ";
        // Botón de me gusta
        var likeButton = document.createElement('button');
        likeButton.className = "twist-action like-btn ".concat(twist.isLiked ? 'liked' : '');
        likeButton.innerHTML = "\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"".concat(twist.isLiked ? 'currentColor' : 'none', "\" stroke=\"currentColor\" stroke-width=\"2\">\n        <path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path>\n      </svg>\n      <span>").concat(twist.likes, "</span>\n    ");
        // Event listeners para las acciones
        replyButton.addEventListener('click', function () {
            _this.showReplyForm(twistElement, twist);
        });
        likeButton.addEventListener('click', function () {
            _this.toggleLike(twist, likeButton);
        });
        actionsBar.appendChild(replyButton);
        actionsBar.appendChild(likeButton);
        header.appendChild(username);
        header.appendChild(timestamp);
        content.appendChild(header);
        content.appendChild(message);
        content.appendChild(actionsBar);
        // Agregar respuestas si existen
        if (twist.replies && twist.replies.length > 0) {
            var repliesContainer_1 = document.createElement('div');
            repliesContainer_1.className = 'replies-container';
            twist.replies.forEach(function (reply) {
                var replyElement = _this.createTwistElement(reply);
                replyElement.classList.add('reply');
                repliesContainer_1.appendChild(replyElement);
            });
            content.appendChild(repliesContainer_1);
        }
        twistElement.appendChild(avatar);
        twistElement.appendChild(content);
        return twistElement;
    };
    TwistApp.prototype.formatTimestamp = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / 60000);
        if (minutes < 1)
            return 'Ahora';
        if (minutes < 60)
            return "".concat(minutes, "m");
        if (minutes < 1440)
            return "".concat(Math.floor(minutes / 60), "h");
        return "".concat(Math.floor(minutes / 1440), "d");
    };
    TwistApp.prototype.generateId = function () {
        return Math.random().toString(36).substr(2, 9);
    };
    TwistApp.prototype.saveToLocalStorage = function () {
        localStorage.setItem('twistThreads', JSON.stringify(this.threads));
    };
    TwistApp.prototype.loadFromLocalStorage = function () {
        var savedThreads = localStorage.getItem('twistThreads');
        if (savedThreads) {
            this.threads = JSON.parse(savedThreads).map(function (twist) { return (__assign(__assign({}, twist), { timestamp: new Date(twist.timestamp), likes: twist.likes || 0, isLiked: twist.isLiked || false, replies: twist.replies || [] })); });
        }
    };
    TwistApp.prototype.toggleLike = function (twist, likeButton) {
        twist.isLiked = !twist.isLiked;
        twist.likes += twist.isLiked ? 1 : -1;
        // Actualizar la apariencia del botón
        var svg = likeButton.querySelector('svg');
        var span = likeButton.querySelector('span');
        if (twist.isLiked) {
            likeButton.classList.add('liked');
            if (svg)
                svg.setAttribute('fill', 'currentColor');
        }
        else {
            likeButton.classList.remove('liked');
            if (svg)
                svg.setAttribute('fill', 'none');
        }
        if (span)
            span.textContent = twist.likes.toString();
        // Guardar en localStorage
        this.saveToLocalStorage();
    };
    TwistApp.prototype.showReplyForm = function (twistElement, parentTwist) {
        var _this = this;
        // Verificar si ya existe un formulario de respuesta
        var existingForm = twistElement.querySelector('.reply-form');
        if (existingForm) {
            existingForm.remove();
            return;
        }
        // Crear formulario de respuesta
        var replyForm = document.createElement('div');
        replyForm.className = 'reply-form';
        var replyTextarea = document.createElement('textarea');
        replyTextarea.placeholder = 'Escribe tu respuesta...';
        replyTextarea.className = 'reply-textarea';
        replyTextarea.maxLength = this.maxCharacters;
        var replyActions = document.createElement('div');
        replyActions.className = 'reply-actions';
        var charCounter = document.createElement('span');
        charCounter.className = 'reply-char-count';
        charCounter.textContent = this.maxCharacters.toString();
        var cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.className = 'cancel-btn';
        var replyButton = document.createElement('button');
        replyButton.textContent = 'Responder';
        replyButton.className = 'reply-submit-btn';
        replyButton.disabled = true;
        // Event listeners para el formulario
        replyTextarea.addEventListener('input', function () {
            var remaining = _this.maxCharacters - replyTextarea.value.length;
            charCounter.textContent = remaining.toString();
            if (remaining < 20) {
                charCounter.style.color = 'var(--error-color)';
            }
            else if (remaining < 50) {
                charCounter.style.color = '#ffa726';
            }
            else {
                charCounter.style.color = 'var(--text-secondary)';
            }
            replyButton.disabled = remaining < 0 || replyTextarea.value.trim() === '';
        });
        cancelButton.addEventListener('click', function () {
            replyForm.remove();
        });
        replyButton.addEventListener('click', function () {
            _this.submitReply(parentTwist, replyTextarea.value.trim(), twistElement);
            replyForm.remove();
        });
        replyActions.appendChild(charCounter);
        replyActions.appendChild(cancelButton);
        replyActions.appendChild(replyButton);
        replyForm.appendChild(replyTextarea);
        replyForm.appendChild(replyActions);
        // Insertar el formulario después del twist
        twistElement.appendChild(replyForm);
        replyTextarea.focus();
    };
    TwistApp.prototype.submitReply = function (parentTwist, replyContent, twistElement) {
        var _a;
        if (!replyContent)
            return;
        var username = this.usernameInput.value.trim() || "Anónimo";
        var avatarUrl = this.avatarInput.value.trim() || "https://via.placeholder.com/80";
        var replyData = {
            id: this.generateId(),
            content: replyContent,
            username: username,
            avatarUrl: avatarUrl,
            timestamp: new Date(),
            likes: 0,
            isLiked: false,
            replies: []
        };
        // Agregar la respuesta al twist padre
        if (!parentTwist.replies) {
            parentTwist.replies = [];
        }
        parentTwist.replies.push(replyData);
        // Crear elemento de respuesta
        var replyElement = this.createTwistElement(replyData);
        replyElement.classList.add('reply');
        // Buscar o crear contenedor de respuestas
        var repliesContainer = twistElement.querySelector('.replies-container');
        if (!repliesContainer) {
            repliesContainer = document.createElement('div');
            repliesContainer.className = 'replies-container';
            (_a = twistElement.querySelector('.twist-content')) === null || _a === void 0 ? void 0 : _a.appendChild(repliesContainer);
        }
        repliesContainer.appendChild(replyElement);
        // Guardar en localStorage
        this.saveToLocalStorage();
        // Scroll hacia la nueva respuesta
        replyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    // Método público para inicializar la aplicación
    TwistApp.prototype.init = function () {
        this.updateCharCount();
        this.updateAvatarPreview();
        console.log('TwistApp inicializada correctamente');
    };
    return TwistApp;
}());
// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    var app = new TwistApp();
    app.init();
});
