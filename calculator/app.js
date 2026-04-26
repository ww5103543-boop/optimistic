const display = document.getElementById('display');
    let currentInput = '0';

    function updateDisplay() {
      display.innerText = currentInput;
      adjustFontSize();
    }

    function adjustFontSize() {
      const length = currentInput.length;
      if (length <= 5) {
        display.style.fontSize = '120px';
      } else if (length <= 7) {
        display.style.fontSize = '100px';
      } else if (length <= 9) {
        display.style.fontSize = '85px';
      } else if (length <= 11) {
        display.style.fontSize = '72px';
      } else if (length <= 13) {
        display.style.fontSize = '60px';
      } else if (length <= 15) {
        display.style.fontSize = '52px';
      } else if (length <= 17) {
        display.style.fontSize = '45px';
      } else {
        display.style.fontSize = '38px';
      }
      
      if (window.innerWidth <= 600) {
        if (length <= 5) {
          display.style.fontSize = '68px';
        } else if (length <= 7) {
          display.style.fontSize = '58px';
        } else if (length <= 9) {
          display.style.fontSize = '50px';
        } else if (length <= 11) {
          display.style.fontSize = '44px';
        } else if (length <= 13) {
          display.style.fontSize = '38px';
        } else {
          display.style.fontSize = '32px';
        }
      }
    }

    function append(char) {
      if (currentInput === '0' && char !== '.') {
        currentInput = char;
      } else {
        if (currentInput.length < 24) currentInput += char;
      }
      updateDisplay();
    }

    function clearDisplay() {
      currentInput = '0';
      updateDisplay();
    }

    function backspace() {
      currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
      updateDisplay();
    }

    function toggleSign() {
      let num = parseFloat(currentInput);
      if (isNaN(num)) return;
      num = -num;
      currentInput = num.toString();
      updateDisplay();
    }

    function calculate() {
      try {
        let result = eval(currentInput.replace(/[^-+/*0-9.]/g, ''));
        currentInput = Number.isInteger(result) ? result.toString() : result.toFixed(4).toString();
      } catch {
        currentInput = "0";
      }
      updateDisplay();
    }

    function handleKeyboard(e) {
      const key = e.key;
      
      const preventKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', 'Enter', '=', 'Backspace', 'Escape', 'Delete'];
      if (preventKeys.includes(key) || key === 'ArrowLeft') {
        e.preventDefault();
      }
      
      if (/^[0-9]$/.test(key)) append(key);
      if (key === '.') append('.');
      if (key === '+') append('+');
      if (key === '-') append('-');
      if (key === '*') append('*');
      if (key === '/') append('/');
      if (key === 'Enter' || key === '=') calculate();
      if (key === 'Backspace') backspace();
      if (key === 'Escape' || key === 'Delete') clearDisplay();
      if (key === 's' || key === 'S' || key === '~') toggleSign();
    }
    
    document.addEventListener('keydown', handleKeyboard);
    window.addEventListener('resize', () => adjustFontSize());
    adjustFontSize();
