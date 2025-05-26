// Clase principal para manejar la aplicación
var TwistApp = /** @class */ (function () {
    function TwistApp() {
        this.maxCharacters = 280;
        this.threads = [];
        this.currentUser = "Usuario"; // En una app real, esto vendría de la autenticación
        // Inicializar elementos del DOM
        this.textArea = document.getElementById('twist-content');
        this.publishButton = document.getElementById('publish-twist');
        this.charCount = document.getElementById('char-count');
        this.threadsList = document.getElementById('threads-list');
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
            _this.publishTwist();
        });
        // Evento para detectar "Enter" y publicar (Ctrl+Enter)
        this.textArea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                _this.publishTwist();
            }
        });
    };
    TwistApp.prototype.updateCharCount = function () {
        var remaining = this.maxCharacters - this.textArea.value.length;
        this.charCount.textContent = remaining.toString();
        // Cambiar el estilo si se acerca o supera el límite
        if (remaining < 0) {
            this.charCount.classList.add('limit');
            this.publishButton.disabled = true;
        }
        else if (remaining < 20) {
            this.charCount.classList.add('limit');
            this.publishButton.disabled = false;
        }
        else {
            this.charCount.classList.remove('limit');
            this.publishButton.disabled = false;
        }
    };
    TwistApp.prototype.publishTwist = function (parentId) {
        // Obtener contenido y validarlo
        var content = parentId ?
            document.getElementById("reply-input-".concat(parentId)).value :
            this.textArea.value;
        if (!content || content.trim() === '' || content.length > this.maxCharacters) {
            return;
        }
        // Crear nuevo twist
        var newTwist = {
            id: this.generateId(),
            content: content.trim(),
            author: this.currentUser,
            timestamp: new Date(),
            likes: 0,
            isThread: !parentId,
            parentId: parentId,
            replies: []
        };
        // Añadir al array de hilos o como respuesta
        if (parentId) {
            // Es una respuesta a un twist existente
            this.addReplyToTwist(parentId, newTwist);
            // Limpiar el textarea de respuesta
            document.getElementById("reply-input-".concat(parentId)).value = '';
        }
        else {
            // Es un nuevo hilo
            this.threads.unshift(newTwist);
            // Limpiar el textarea principal
            this.textArea.value = '';
            this.updateCharCount();
        }
        // Guardar en localStorage
        this.saveToLocalStorage();
        // Renderizar hilos actualizados
        this.renderThreads();
    };
    TwistApp.prototype.addReplyToTwist = function (twistId, reply) {
        // Función recursiva para buscar el twist al que responder
        var findAndAddReply = function (items) {
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                if (item.id === twistId) {
                    item.replies.push(reply);
                    return true;
                }
                if (item.replies.length > 0) {
                    if (findAndAddReply(item.replies)) {
                        return true;
                    }
                }
            }
            return false;
        };
        findAndAddReply(this.threads);
    };
    TwistApp.prototype.renderThreads = function () {
        var _this = this;
        // Limpiar la lista actual
        this.threadsList.innerHTML = '';
        // Verificar si hay hilos para mostrar
        if (this.threads.length === 0) {
            this.threadsList.innerHTML = "\n        <div class=\"no-threads\">\n          <p>No hay hilos para mostrar. \u00A1S\u00E9 el primero en publicar!</p>\n        </div>\n      ";
            return;
        }
        // Renderizar cada hilo
        this.threads.forEach(function (thread) {
            var threadElement = _this.createThreadElement(thread);
            _this.threadsList.appendChild(threadElement);
        });
    };
    TwistApp.prototype.createThreadElement = function (thread) {
        var _this = this;
        var threadElement = document.createElement('div');
        threadElement.className = 'thread';
        threadElement.dataset.threadId = thread.id;
        // Crear el elemento del twist principal
        threadElement.appendChild(this.createTwistElement(thread));
        // Renderizar respuestas recursivamente si existen
        if (thread.replies.length > 0) {
            var repliesContainer_1 = document.createElement('div');
            repliesContainer_1.className = 'replies';
            thread.replies.forEach(function (reply) {
                repliesContainer_1.appendChild(_this.createTwistElement(reply));
            });
            threadElement.appendChild(repliesContainer_1);
        }
        return threadElement;
    };
    TwistApp.prototype.createTwistElement = function (twist) {
        var _this = this;
        var twistElement = document.createElement('div');
        twistElement.className = 'twist';
        twistElement.dataset.twistId = twist.id;
        // Formatear fecha
        var formattedDate = this.formatDate(twist.timestamp);
        // Crear contenido HTML del twist
        twistElement.innerHTML = "\n      <div class=\"twist-header\">\n        <span class=\"twist-author\">".concat(twist.author, "</span>\n        <span class=\"twist-time\">").concat(formattedDate, "</span>\n      </div>\n      <div class=\"twist-content\">").concat(this.formatContent(twist.content), "</div>\n      <div class=\"twist-actions-bar\">\n        <span class=\"twist-action like-action\" data-twist-id=\"").concat(twist.id, "\">\n          <i class=\"far fa-heart\"></i> ").concat(twist.likes, "\n        </span>\n        <span class=\"twist-action reply-action\" data-twist-id=\"").concat(twist.id, "\">\n          <i class=\"far fa-comment\"></i> Responder\n        </span>\n      </div>\n      <div class=\"reply-container\" id=\"reply-container-").concat(twist.id, "\" style=\"display: none;\">\n        <div class=\"reply-input\">\n          <textarea id=\"reply-input-").concat(twist.id, "\" placeholder=\"Escribe tu respuesta...\"></textarea>\n          <button class=\"reply-button\" data-parent-id=\"").concat(twist.id, "\">Responder</button>\n        </div>\n      </div>\n    ");
        // Añadir event listeners a los botones de acción
        setTimeout(function () {
            // Like action
            var likeButton = twistElement.querySelector(".like-action[data-twist-id=\"".concat(twist.id, "\"]"));
            likeButton.addEventListener('click', function () { return _this.likeTwist(twist.id); });
            // Reply action
            var replyButton = twistElement.querySelector(".reply-action[data-twist-id=\"".concat(twist.id, "\"]"));
            replyButton.addEventListener('click', function () { return _this.toggleReplyInput(twist.id); });
            // Submit reply
            var submitReplyButton = twistElement.querySelector(".reply-button[data-parent-id=\"".concat(twist.id, "\"]"));
            submitReplyButton.addEventListener('click', function () { return _this.publishTwist(twist.id); });
        }, 0);
        return twistElement;
    };
    TwistApp.prototype.toggleReplyInput = function (twistId) {
        var replyContainer = document.getElementById("reply-container-".concat(twistId));
        if (replyContainer) {
            var isVisible = replyContainer.style.display !== 'none';
            replyContainer.style.display = isVisible ? 'none' : 'block';
            // Enfocar el textarea si se está mostrando
            if (!isVisible) {
                var textarea = document.getElementById("reply-input-".concat(twistId));
                textarea.focus();
            }
        }
    };
    TwistApp.prototype.likeTwist = function (twistId) {
        // Función recursiva para encontrar y dar like a un twist
        var findAndLikeTwist = function (items) {
            for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
                var item = items_2[_i];
                if (item.id === twistId) {
                    item.likes++;
                    return true;
                }
                if (item.replies.length > 0) {
                    if (findAndLikeTwist(item.replies)) {
                        return true;
                    }
                }
            }
            return false;
        };
        // Buscar y dar like
        if (findAndLikeTwist(this.threads)) {
            // Guardar en localStorage
            this.saveToLocalStorage();
            // Actualizar la UI
            this.renderThreads();
        }
    };
    TwistApp.prototype.formatContent = function (content) {
        // Convertir URLs en enlaces
        var formattedContent = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        // Convertir hashtags
        formattedContent = formattedContent.replace(/#(\w+)/g, '<a href="#" class="hashtag">#$1</a>');
        // Convertir menciones
        formattedContent = formattedContent.replace(/@(\w+)/g, '<a href="#" class="mention">@$1</a>');
        return formattedContent;
    };
    TwistApp.prototype.formatDate = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        // Menos de un minuto
        if (diff < 60000) {
            return 'hace unos segundos';
        }
        // Menos de una hora
        if (diff < 3600000) {
            var minutes = Math.floor(diff / 60000);
            return "hace ".concat(minutes, " ").concat(minutes === 1 ? 'minuto' : 'minutos');
        }
        // Menos de un día
        if (diff < 86400000) {
            var hours = Math.floor(diff / 3600000);
            return "hace ".concat(hours, " ").concat(hours === 1 ? 'hora' : 'horas');
        }
        // Menos de una semana
        if (diff < 604800000) {
            var days = Math.floor(diff / 86400000);
            return "hace ".concat(days, " ").concat(days === 1 ? 'día' : 'días');
        }
        // Formato completo de fecha
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };
    TwistApp.prototype.generateId = function () {
        // Generar un ID único con timestamp y número aleatorio
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    TwistApp.prototype.saveToLocalStorage = function () {
        localStorage.setItem('twist-threads', JSON.stringify(this.threads));
    };
    TwistApp.prototype.loadFromLocalStorage = function () {
        var storedThreads = localStorage.getItem('twist-threads');
        if (storedThreads) {
            try {
                var parsedThreads = JSON.parse(storedThreads);
                // Convertir las fechas de string a Date
                this.threads = this.convertDates(parsedThreads);
            }
            catch (error) {
                console.error('Error al cargar datos del localStorage:', error);
                this.threads = [];
            }
        }
    };
    TwistApp.prototype.convertDates = function (items) {
        var _this = this;
        return items.map(function (item) {
            // Convertir timestamp a Date
            item.timestamp = new Date(item.timestamp);
            // Convertir recursivamente las fechas en las respuestas
            if (item.replies && Array.isArray(item.replies)) {
                item.replies = _this.convertDates(item.replies);
            }
            return item;
        });
    };
    return TwistApp;
}());
// Inicializar la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function () {
    // Cargar Font Awesome para iconos
    var fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);
    // Iniciar la aplicación
    new TwistApp();
});
