const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedChart(chartId);
          setTimeout(() => setCopiedChart(null), 2000);
        }
      } catch (err) {
        console.error('Failed to copy image:', err);
      }`;

const replace = `        if (blob) {
          if (document.hasFocus()) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedChart(chartId);
            setTimeout(() => setCopiedChart(null), 2000);
          } else {
            console.warn('Document is not focused. Unable to write to clipboard.');
            // Fallback: download the image instead
            saveAs(blob, \`\${chartId}.png\`);
            setCopiedChart(chartId);
            setTimeout(() => setCopiedChart(null), 2000);
          }
        }
      } catch (err) {
        console.warn('Failed to copy image:', err);
        // Fallback: don't crash, just log warning
      }`;

code = code.replace(target, replace);
fs.writeFileSync('src/App.tsx', code);
