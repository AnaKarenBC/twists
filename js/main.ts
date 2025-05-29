// Interfaz para definir la estructura de un Twist
interface Twist {
  id: string;
  content: string;
  username: string;
  avatarUrl: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
  replies?: Twist[];
}

// Clase principal para manejar la aplicación
class TwistApp {
  private maxCharacters: number = 280;
  private threads: Twist[] = [];
  private currentUser: string = "Usuario";
  private currentThread: HTMLDivElement | null = null;
  
  // Elementos del DOM
  private textArea: HTMLTextAreaElement;
  private publishButton: HTMLButtonElement;
  private charCount: HTMLSpanElement;
  private threadsList: HTMLDivElement;
  private usernameInput: HTMLInputElement;
  private avatarInput: HTMLInputElement;
  private twistContainer: HTMLDivElement;
  private avatarPreview: HTMLImageElement;
  
  constructor() {
    // Inicializar elementos del DOM
    this.textArea = document.getElementById('twist-content') as HTMLTextAreaElement;
    this.publishButton = document.getElementById('publish-twist') as HTMLButtonElement;
    this.charCount = document.getElementById('char-count') as HTMLSpanElement;
    this.threadsList = document.getElementById('threads-list') as HTMLDivElement;
    this.usernameInput = document.getElementById('username-input') as HTMLInputElement;
    this.avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
    this.twistContainer = document.getElementById('twist-container') as HTMLDivElement;
    this.avatarPreview = document.getElementById('avatar-preview') as HTMLImageElement;
    
    // Cargar datos almacenados localmente si existen
    this.loadFromLocalStorage();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Renderizar hilos existentes
    this.renderThreads();
  }
  
  private setupEventListeners(): void {
    // Evento para contar caracteres al escribir
    this.textArea.addEventListener('input', () => {
      this.updateCharCount();
    });
    
    // Evento para publicar un nuevo twist
    this.publishButton.addEventListener('click', () => {
      this.publishTwistWithAvatar();
    });
    
    // Evento para detectar "Enter" y publicar (Ctrl+Enter)
    this.textArea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.publishTwistWithAvatar();
      }
    });

    // Evento para actualizar el preview del avatar
    this.avatarInput.addEventListener('input', () => {
      this.updateAvatarPreview();
    });

    // Evento para actualizar el preview cuando se pierde el foco
    this.avatarInput.addEventListener('blur', () => {
      this.updateAvatarPreview();
    });
  }

  private updateAvatarPreview(): void {
    const avatarUrl = this.avatarInput.value.trim();
    if (avatarUrl) {
      // Verificar si la URL es válida
      const img = new Image();
      img.onload = () => {
        this.avatarPreview.src = avatarUrl;
      };
      img.onerror = () => {
        this.avatarPreview.src = "https://via.placeholder.com/80";
      };
      img.src = avatarUrl;
    } else {
      this.avatarPreview.src = "";
    }
  }

  private publishTwistWithAvatar(): void {
    const text = this.textArea.value.trim();
    const username = this.usernameInput.value.trim() || "Anónimo";
    const avatarUrl = this.avatarInput.value.trim() || "https://via.placeholder.com/80";

    if (text === "") return;

    // Crear el twist con avatar
    const twist = document.createElement("div");
    twist.className = "twist";

    const avatar = document.createElement("img");
    avatar.src = avatarUrl;
    avatar.className = "twist-avatar";
    avatar.onerror = () => {
      avatar.src = "https://via.placeholder.com/80";
    };

    const content = document.createElement("div");
    content.className = "twist-content";

    const header = document.createElement("div");
    header.className = "twist-header";

    const user = document.createElement("span");
    user.className = "username";
    user.textContent = username;

    const timestamp = document.createElement("span");
    timestamp.className = "twist-timestamp";
    timestamp.textContent = "Ahora";

    const message = document.createElement("span");
    message.className = "message";
    message.textContent = text;

    // Crear barra de acciones
    const actionsBar = document.createElement("div");
    actionsBar.className = "twist-actions-bar";

    // Botón de responder
    const replyButton = document.createElement("button");
    replyButton.className = "twist-action reply-btn";
    replyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Responder</span>
    `;

    // Botón de me gusta
    const likeButton = document.createElement("button");
    likeButton.className = "twist-action like-btn";
    likeButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span>0</span>
    `;

    // Event listeners para las acciones
    replyButton.addEventListener('click', () => {
      this.showReplyForm(twist, twistData);
    });

    likeButton.addEventListener('click', () => {
      this.toggleLike(twistData, likeButton);
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
    const twistData: Twist = {
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
  }

  private updateCharCount(): void {
    const currentLength = this.textArea.value.length;
    const remaining = this.maxCharacters - currentLength;
    
    this.charCount.textContent = `${remaining}`;
    
    // Cambiar color según los caracteres restantes
    if (remaining < 20) {
      this.charCount.style.color = 'var(--error-color)';
      this.charCount.classList.add('limit');
    } else if (remaining < 50) {
      this.charCount.style.color = '#ffa726';
      this.charCount.classList.remove('limit');
    } else {
      this.charCount.style.color = 'var(--text-secondary)';
      this.charCount.classList.remove('limit');
    }
    
    // Deshabilitar botón si se excede el límite
    this.publishButton.disabled = remaining < 0 || this.textArea.value.trim() === '';
  }

  private renderThreads(): void {
    this.threadsList.innerHTML = '';
    
    this.threads.forEach(twist => {
      const threadElement = this.createTwistElement(twist);
      this.threadsList.appendChild(threadElement);
    });
  }

  private createTwistElement(twist: Twist): HTMLDivElement {
    const twistElement = document.createElement('div');
    twistElement.className = 'twist';
    
    const avatar = document.createElement('img');
    avatar.src = twist.avatarUrl;
    avatar.className = 'twist-avatar';
    avatar.onerror = () => {
      avatar.src = "https://via.placeholder.com/80";
    };

    const content = document.createElement('div');
    content.className = 'twist-content';

    const header = document.createElement('div');
    header.className = 'twist-header';

    const username = document.createElement('span');
    username.className = 'username';
    username.textContent = twist.username;

    const timestamp = document.createElement('span');
    timestamp.className = 'twist-timestamp';
    timestamp.textContent = this.formatTimestamp(twist.timestamp);

    const message = document.createElement('span');
    message.className = 'message';
    message.textContent = twist.content;

    // Crear barra de acciones
    const actionsBar = document.createElement('div');
    actionsBar.className = 'twist-actions-bar';

    // Botón de responder
    const replyButton = document.createElement('button');
    replyButton.className = 'twist-action reply-btn';
    replyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Responder</span>
    `;

    // Botón de me gusta
    const likeButton = document.createElement('button');
    likeButton.className = `twist-action like-btn ${twist.isLiked ? 'liked' : ''}`;
    likeButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="${twist.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span>${twist.likes}</span>
    `;

    // Event listeners para las acciones
    replyButton.addEventListener('click', () => {
      this.showReplyForm(twistElement, twist);
    });

    likeButton.addEventListener('click', () => {
      this.toggleLike(twist, likeButton);
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
      const repliesContainer = document.createElement('div');
      repliesContainer.className = 'replies-container';
      
      twist.replies.forEach(reply => {
        const replyElement = this.createTwistElement(reply);
        replyElement.classList.add('reply');
        repliesContainer.appendChild(replyElement);
      });
      
      content.appendChild(repliesContainer);
    }

    twistElement.appendChild(avatar);
    twistElement.appendChild(content);
    
    return twistElement;
  }

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('twistThreads', JSON.stringify(this.threads));
  }

  private loadFromLocalStorage(): void {
    const savedThreads = localStorage.getItem('twistThreads');
    if (savedThreads) {
      this.threads = JSON.parse(savedThreads).map((twist: any) => ({
        ...twist,
        timestamp: new Date(twist.timestamp),
        likes: twist.likes || 0,
        isLiked: twist.isLiked || false,
        replies: twist.replies || []
      }));
    }
  }

  private toggleLike(twist: Twist, likeButton: HTMLButtonElement): void {
    twist.isLiked = !twist.isLiked;
    twist.likes += twist.isLiked ? 1 : -1;

    // Actualizar la apariencia del botón
    const svg = likeButton.querySelector('svg');
    const span = likeButton.querySelector('span');
    
    if (twist.isLiked) {
      likeButton.classList.add('liked');
      if (svg) svg.setAttribute('fill', 'currentColor');
    } else {
      likeButton.classList.remove('liked');
      if (svg) svg.setAttribute('fill', 'none');
    }
    
    if (span) span.textContent = twist.likes.toString();

    // Guardar en localStorage
    this.saveToLocalStorage();
  }

  private showReplyForm(twistElement: HTMLElement, parentTwist: Twist): void {
    // Verificar si ya existe un formulario de respuesta
    const existingForm = twistElement.querySelector('.reply-form');
    if (existingForm) {
      existingForm.remove();
      return;
    }

    // Crear formulario de respuesta
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    
    const replyTextarea = document.createElement('textarea');
    replyTextarea.placeholder = 'Escribe tu respuesta...';
    replyTextarea.className = 'reply-textarea';
    replyTextarea.maxLength = this.maxCharacters;

    const replyActions = document.createElement('div');
    replyActions.className = 'reply-actions';

    const charCounter = document.createElement('span');
    charCounter.className = 'reply-char-count';
    charCounter.textContent = this.maxCharacters.toString();

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.className = 'cancel-btn';

    const replyButton = document.createElement('button');
    replyButton.textContent = 'Responder';
    replyButton.className = 'reply-submit-btn';
    replyButton.disabled = true;

    // Event listeners para el formulario
    replyTextarea.addEventListener('input', () => {
      const remaining = this.maxCharacters - replyTextarea.value.length;
      charCounter.textContent = remaining.toString();
      
      if (remaining < 20) {
        charCounter.style.color = 'var(--error-color)';
      } else if (remaining < 50) {
        charCounter.style.color = '#ffa726';
      } else {
        charCounter.style.color = 'var(--text-secondary)';
      }
      
      replyButton.disabled = remaining < 0 || replyTextarea.value.trim() === '';
    });

    cancelButton.addEventListener('click', () => {
      replyForm.remove();
    });

    replyButton.addEventListener('click', () => {
      this.submitReply(parentTwist, replyTextarea.value.trim(), twistElement);
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
  }

  private submitReply(parentTwist: Twist, replyContent: string, twistElement: HTMLElement): void {
    if (!replyContent) return;

    const username = this.usernameInput.value.trim() || "Anónimo";
    const avatarUrl = this.avatarInput.value.trim() || "https://via.placeholder.com/80";

    const replyData: Twist = {
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
    const replyElement = this.createTwistElement(replyData);
    replyElement.classList.add('reply');

    // Buscar o crear contenedor de respuestas
    let repliesContainer = twistElement.querySelector('.replies-container');
    if (!repliesContainer) {
      repliesContainer = document.createElement('div');
      repliesContainer.className = 'replies-container';
      twistElement.querySelector('.twist-content')?.appendChild(repliesContainer);
    }

    repliesContainer.appendChild(replyElement);

    // Guardar en localStorage
    this.saveToLocalStorage();

    // Scroll hacia la nueva respuesta
    replyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Método público para inicializar la aplicación
  public init(): void {
    this.updateCharCount();
    this.updateAvatarPreview();
    console.log('TwistApp inicializada correctamente');
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const app = new TwistApp();
  app.init();
});

