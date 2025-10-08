/**
 * FormatUtils - Módulo centralizado para formateo de números y monedas
 * Este módulo asegura consistencia en todo el proyecto
 * @version 1.0.0
 */

const FormatUtils = {
    /**
     * Formatea un número como moneda chilena (formato español)
     * @param {number} amount - Cantidad a formatear
     * @param {boolean} showDecimals - Mostrar decimales (default: false)
     * @returns {string} - Número formateado (ej: "49.000" o "49.000,50")
     */
    formatCurrency(amount, showDecimals = false) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '0';
        }
        
        const options = showDecimals 
            ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            : { minimumFractionDigits: 0, maximumFractionDigits: 0 };
        
        return new Intl.NumberFormat('es-CL', options).format(amount);
    },

    /**
     * Parsea un string formateado a número
     * @param {string|number} formattedString - String con formato (ej: "49.000" o "49.000,50")
     * @returns {number} - Número parseado
     */
    parseCurrency(formattedString) {
        // Si ya es un número, devolverlo directamente
        if (typeof formattedString === 'number') {
            return formattedString;
        }
        
        // Si no es string, intentar convertir
        if (typeof formattedString !== 'string') {
            return parseFloat(formattedString) || 0;
        }
        
        // Remover separadores de miles (puntos) y reemplazar coma decimal con punto
        const cleaned = formattedString
            .replace(/\./g, '')      // Eliminar puntos (separador de miles)
            .replace(',', '.');       // Convertir coma decimal a punto
        
        return parseFloat(cleaned) || 0;
    },

    /**
     * Formatea precio unitario (sin decimales, redondeado)
     * @param {number} price - Precio a formatear
     * @returns {string} - Precio formateado (ej: "49.000")
     */
    formatPrice(price) {
        return this.formatCurrency(Math.round(price), false);
    },

    /**
     * Formatea cantidad/importe (sin decimales, redondeado)
     * @param {number} amount - Cantidad a formatear
     * @returns {string} - Cantidad formateada (ej: "98.000")
     */
    formatAmount(amount) {
        return this.formatCurrency(Math.round(amount), false);
    },

    /**
     * Formatea número para mostrar en tablas
     * @param {number} value - Valor a formatear
     * @returns {string} - Valor formateado
     */
    formatTableValue(value) {
        return this.formatCurrency(Math.round(value), false);
    },

    /**
     * Formatea totales (mismo que formatAmount, pero más explícito)
     * @param {number} total - Total a formatear
     * @returns {string} - Total formateado
     */
    formatTotal(total) {
        return this.formatCurrency(Math.round(total), false);
    },

    /**
     * Formatea una fecha y hora a 'YYYY-MM-DD HH:MM'
     * @param {string} dateString - String de fecha y hora (ej: '2023-10-27 10:30:00')
     * @returns {string} - Fecha y hora formateada (ej: '2023-10-27 10:30')
     */
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        
        // Options for Chile timezone (America/Santiago) and desired format
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // Use 24-hour format
            timeZone: 'America/Santiago'
        };

        // Format the date and time
        const formatter = new Intl.DateTimeFormat('es-CL', options);
        const parts = formatter.formatToParts(date);

        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        const hour = parts.find(p => p.type === 'hour').value;
        const minute = parts.find(p => p.type === 'minute').value;

        return `${day}-${month}-${year} ${hour}:${minute}`;
    }
};

// Exportar para uso global en el navegador
if (typeof window !== 'undefined') {
    window.FormatUtils = FormatUtils;
}

// Exportar para uso en módulos (si se usa con bundlers)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormatUtils;
}
