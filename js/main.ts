// Interfaces
interface Twist {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  isThread: boolean;
  parentId?: string;
  replies: Twist[];
}

// Clase principal para manejar la aplicación
class TwistApp {
  private maxCharacters: number = 280;
  private threads: Twist[] = [];
  private currentUser: string = "Usuario"; // En una app real, esto vendría de la autenticación
  
  // Elementos del DOM
  private textArea: HTMLTextAreaElement;
  private publishButton: HTMLButtonElement;
  private charCount: HTMLSpanElement;
  private threadsList: HTMLDivElement;
  
  constructor() {
    // Inicializar elementos del DOM
    this.textArea = document.getElementById('twist-content') as HTMLTextAreaElement;
    this.publishButton = document.getElementById('publish-twist') as HTMLButtonElement;
    this.charCount = document.getElementById('char-count') as HTMLSpanElement;
    this.threadsList = document.getElementById('threads-list') as HTMLDivElement;
    
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
      this.publishTwist();
    });
    
    // Evento para detectar "Enter" y publicar (Ctrl+Enter)
    this.textArea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.publishTwist();
      }
    });
  }
  
  private updateCharCount(): void {
    const remaining = this.maxCharacters - this.textArea.value.length;
    this.charCount.textContent = remaining.toString();
    
    // Cambiar el estilo si se acerca o supera el límite
    if (remaining < 0) {
      this.charCount.classList.add('limit');
      this.publishButton.disabled = true;
    } else if (remaining < 20) {
      this.charCount.classList.add('limit');
      this.publishButton.disabled = false;
    } else {
      this.charCount.classList.remove('limit');
      this.publishButton.disabled = false;
    }
  }
  
  private publishTwist(parentId?: string): void {
    // Obtener contenido y validarlo
    const content = parentId ? 
      (document.getElementById(`reply-input-${parentId}`) as HTMLTextAreaElement).value :
      this.textArea.value;
      
    if (!content || content.trim() === '' || content.length > this.maxCharacters) {
      return;
    }
    
    // Crear nuevo twist
    const newTwist: Twist = {
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
      (document.getElementById(`reply-input-${parentId}`) as HTMLTextAreaElement).value = '';
    } else {
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
  }
  
  private addReplyToTwist(twistId: string, reply: Twist): void {
    // Función recursiva para buscar el twist al que responder
    const findAndAddReply = (items: Twist[]): boolean => {
      for (const item of items) {
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
  }
  
  private renderThreads(): void {
    // Limpiar la lista actual
    this.threadsList.innerHTML = '';
    
    // Verificar si hay hilos para mostrar
    if (this.threads.length === 0) {
      this.threadsList.innerHTML = `
        <div class="no-threads">
          <p>No hay hilos para mostrar. ¡Sé el primero en publicar!</p>
        </div>
      `;
      return;
    }
    
    // Renderizar cada hilo
    this.threads.forEach(thread => {
      const threadElement = this.createThreadElement(thread);
      this.threadsList.appendChild(threadElement);
    });
  }
  
  private createThreadElement(thread: Twist): HTMLElement {
    const threadElement = document.createElement('div');
    threadElement.className = 'thread';
    threadElement.dataset.threadId = thread.id;
    
    // Crear el elemento del twist principal
    threadElement.appendChild(this.createTwistElement(thread));
    
    // Renderizar respuestas recursivamente si existen
    if (thread.replies.length > 0) {
      const repliesContainer = document.createElement('div');
      repliesContainer.className = 'replies';
      
      thread.replies.forEach(reply => {
        repliesContainer.appendChild(this.createTwistElement(reply));
      });
      
      threadElement.appendChild(repliesContainer);
    }
    
    return threadElement;
  }
  
  private createTwistElement(twist: Twist): HTMLElement {
    const twistElement = document.createElement('div');
    twistElement.className = 'twist';
    twistElement.dataset.twistId = twist.id;
    
    // Formatear fecha
    const formattedDate = this.formatDate(twist.timestamp);
    
    // Crear contenido HTML del twist
    twistElement.innerHTML = `
      <div class="twist-header">
        <span class="twist-author">${twist.author}</span>
        <span class="twist-time">${formattedDate}</span>
      </div>
      <div class="twist-content">${this.formatContent(twist.content)}</div>
      <div class="twist-actions-bar">
        <span class="twist-action like-action" data-twist-id="${twist.id}">
          <i class="far fa-heart"></i> ${twist.likes}
        </span>
        <span class="twist-action reply-action" data-twist-id="${twist.id}">
          <i class="far fa-comment"></i> Responder
        </span>
      </div>
      <div class="reply-container" id="reply-container-${twist.id}" style="display: none;">
        <div class="reply-input">
          <textarea id="reply-input-${twist.id}" placeholder="Escribe tu respuesta..."></textarea>
          <button class="reply-button" data-parent-id="${twist.id}">Responder</button>
        </div>
      </div>
    `;
    
    // Añadir event listeners a los botones de acción
    setTimeout(() => {
      // Like action
      const likeButton = twistElement.querySelector(`.like-action[data-twist-id="${twist.id}"]`) as HTMLElement;
      likeButton.addEventListener('click', () => this.likeTwist(twist.id));
      
      // Reply action
      const replyButton = twistElement.querySelector(`.reply-action[data-twist-id="${twist.id}"]`) as HTMLElement;
      replyButton.addEventListener('click', () => this.toggleReplyInput(twist.id));
      
      // Submit reply
      const submitReplyButton = twistElement.querySelector(`.reply-button[data-parent-id="${twist.id}"]`) as HTMLElement;
      submitReplyButton.addEventListener('click', () => this.publishTwist(twist.id));
    }, 0);
    
    return twistElement;
  }
  
  private toggleReplyInput(twistId: string): void {
    const replyContainer = document.getElementById(`reply-container-${twistId}`);
    if (replyContainer) {
      const isVisible = replyContainer.style.display !== 'none';
      replyContainer.style.display = isVisible ? 'none' : 'block';
      
      // Enfocar el textarea si se está mostrando
      if (!isVisible) {
        const textarea = document.getElementById(`reply-input-${twistId}`) as HTMLTextAreaElement;
        textarea.focus();
      }
    }
  }
  
  private likeTwist(twistId: string): void {
    // Función recursiva para encontrar y dar like a un twist
    const findAndLikeTwist = (items: Twist[]): boolean => {
      for (const item of items) {
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
  }
  
  private formatContent(content: string): string {
    // Convertir URLs en enlaces
    let formattedContent = content.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank">$1</a>'
    );
    
    // Convertir hashtags
    formattedContent = formattedContent.replace(
      /#(\w+)/g, 
      '<a href="#" class="hashtag">#$1</a>'
    );
    
    // Convertir menciones
    formattedContent = formattedContent.replace(
      /@(\w+)/g, 
      '<a href="#" class="mention">@$1</a>'
    );
    
    return formattedContent;
  }
  
  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Menos de un minuto
    if (diff < 60000) {
      return 'hace unos segundos';
    }
    
    // Menos de una hora
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    // Menos de un día
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Menos de una semana
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    
    // Formato completo de fecha
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  private generateId(): string {
    // Generar un ID único con timestamp y número aleatorio
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private saveToLocalStorage(): void {
    localStorage.setItem('twist-threads', JSON.stringify(this.threads));
  }
  
  private loadFromLocalStorage(): void {
    const storedThreads = localStorage.getItem('twist-threads');
    if (storedThreads) {
      try {
        const parsedThreads = JSON.parse(storedThreads);
        // Convertir las fechas de string a Date
        this.threads = this.convertDates(parsedThreads);
      } catch (error) {
        console.error('Error al cargar datos del localStorage:', error);
        this.threads = [];
      }
    }
  }
  
  private convertDates(items: any[]): Twist[] {
    return items.map(item => {
      // Convertir timestamp a Date
      item.timestamp = new Date(item.timestamp);
      
      // Convertir recursivamente las fechas en las respuestas
      if (item.replies && Array.isArray(item.replies)) {
        item.replies = this.convertDates(item.replies);
      }
      
      return item as Twist;
    });
  }
}

// Inicializar la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Cargar Font Awesome para iconos
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
  document.head.appendChild(fontAwesome);
  
  // Iniciar la aplicación
  new TwistApp();
});