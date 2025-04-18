// Proteção XSS avançada
export const sanitize = {
    html: (unsafe) => {
        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    input: (input) => {
        return input.replace(/[<>"'`]/g, '');
    }
};

// Gerenciamento de cookies seguro
export const cookieManager = {
    set(name, value, days = 1) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;Secure;SameSite=Strict`;
    },
    
    get(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
                return cookieValue;
            }
        }
        return null;
    },
    
    remove(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;Secure;SameSite=Strict`;
    }
};

// Validação de dados
export const validator = {
    email: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    password: (password) => {
        return password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /[0-9]/.test(password);
    },
    
    cpf: (cpf) => {
        // Implementação real de validação de CPF
        cpf = cpf.replace(/[^\d]+/g,'');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        
        let rest = 11 - (sum % 11);
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        
        rest = 11 - (sum % 11);
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }
};

// Monitoramento de erros
export const errorHandler = {
    log(error) {
        console.error(error);
        if (typeof window !== 'undefined' && window._trackJs) {
            window._trackJs.track(error);
        }
    },
    
    setupGlobalHandlers() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.log({
                message,
                source,
                line: lineno,
                column: colno,
                stack: error?.stack,
                userAgent: navigator.userAgent
            });
            return true; // Previne execução do handler padrão
        };
        
        window.addEventListener('unhandledrejection', (event) => {
            this.log(event.reason);
            event.preventDefault();
        });
    }
};

// Inicialização automática do handler de erros
errorHandler.setupGlobalHandlers();