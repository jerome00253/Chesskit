import { useTranslations } from 'next-intl';

interface TacticalDescriptionProps {
  description: string;
}

/**
 * Component to render tactical descriptions from i18n JSON keys
 * Handles both legacy text descriptions and new i18n format
 */

/**
 * Convert chess notation (SAN) to readable French text
 * Examples: Qxf3 → "Dame prend en f3", Nf6 → "Cavalier en f6"
 */
function convertSanToText(san: string, t: any): string {
  // Handle castling
  if (san === 'O-O') return 'petit roque';
  if (san === 'O-O-O') return 'grand roque';
  
  // Parse the move
  let result = '';
  
  // Get piece (if specified)
  const pieceMap: Record<string, string> = {
    'K': t('Tactical.pieces.king'),
    'Q': t('Tactical.pieces.queen'),
    'R': t('Tactical.pieces.rook'),
    'B': t('Tactical.pieces.bishop'),
    'N': t('Tactical.pieces.knight')
  };
  
  if (pieceMap[san[0]]) {
    result = pieceMap[san[0]];
  } else {
    result = t('Tactical.pieces.pawn');
  }
  
  // Check for capture
  const hasCapture = san.includes('x');
  if (hasCapture) {
    result += ' prend';
  }
  
  // Get destination square
  const match = san.match(/([a-h][1-8])/);
  if (match) {
    result += ' en ' + match[1];
  }
  
  // Check for promotion
  if (san.includes('=')) {
    const promotionPiece = san[san.indexOf('=') + 1];
    if (pieceMap[promotionPiece]) {
      result += ' se transforme en ' + pieceMap[promotionPiece];
    }
  }
  
  // Check for check/checkmate
  if (san.endsWith('#')) {
    result += ' échec et mat';
  } else if (san.endsWith('+')) {
    result += ' échec';
  }
  
  return result;
}

export function TacticalDescription({ description }: TacticalDescriptionProps) {
  const t = useTranslations();

  if (!description) {
    return null;
  }

  // Extract JSON objects and text by parsing character by character
  const extractParts = (str: string): Array<{type: 'json' | 'text', content: string}> => {
    const parts: Array<{type: 'json' | 'text', content: string}> = [];
    let braceCount = 0;
    let startIndex = -1;
    let lastEnd = 0;
    
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') {
        if (braceCount === 0) {
          // Save any text before this JSON
          if (i > lastEnd) {
            const textPart = str.substring(lastEnd, i).trim();
            if (textPart) {
              parts.push({type: 'text', content: textPart});
            }
          }
          startIndex = i;
        }
        braceCount++;
      } else if (str[i] === '}') {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          parts.push({type: 'json', content: str.substring(startIndex, i + 1)});
          lastEnd = i + 1;
          startIndex = -1;
        }
      }
    }
    
    // Add any remaining text
    if (lastEnd < str.length) {
      const textPart = str.substring(lastEnd).trim();
      if (textPart) {
        parts.push({type: 'text', content: textPart});
      }
    }
    
    return parts;
  };

  const parts = extractParts(description);
  
  if (parts && parts.length > 0) {
    const renderedParts: string[] = [];
    
    for (const part of parts) {
      if (part.type === 'text') {
        // Plain text - convert any chess notation to French text
        let textContent = part.content;
        // Try to detect chess notation patterns and convert them
        // Pattern: "En jouant Qxf3," or "Nous aurions pu jouer Nf6"
        const moveMatch = textContent.match(/([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|O-O(?:-O)?)/);
        if (moveMatch) {
          const san = moveMatch[0];
          const convertedMove = convertSanToText(san, t);
          textContent = textContent.replace(san, convertedMove);
        }
        renderedParts.push(textContent);
      } else {
        // JSON part, parse and translate
        try {
          const parsed = JSON.parse(part.content);
          
          if (parsed.key && typeof parsed.key === 'string') {
            const { key, params = {} } = parsed;
            
            // Translate nested piece names in params
            const translatedParams: Record<string, string> = {};
            for (const [paramKey, paramValue] of Object.entries(params)) {
              if (typeof paramValue === 'string' && paramValue.startsWith('Tactical.pieces.')) {
                const translated = t(paramValue);
                translatedParams[paramKey] = translated;
              } else {
                translatedParams[paramKey] = paramValue as string;
              }
            }
            
            const finalMessage = t(key, translatedParams);
            
            // Try to get the theme name from the key
            const themeName = key.split('.').pop(); // e.g., "fork" from "Tactical.descriptions.fork"
            
            // Do not look up themes for general descriptions or opening phrases
            const excludedThemes = ['simple_move', 'by_playing'];
            const isOpeningPhrase = key.includes('.opening.');
            const shouldAddThemeLabel = themeName && !excludedThemes.includes(themeName) && !isOpeningPhrase;
            
            let themeLabel = '';
            if (shouldAddThemeLabel) {
                 try {
                    // This might throw if key missing and not handled
                    // But next-intl usually handles it. 
                    // To be safe we could wrap or just ignore.
                    // However, we can't easily check existence without try/catch if config is strict.
                    const potentialThemeKey = `Tactical.themes.${themeName}`;
                    // We rely on the fact that if it throws, we catch it outside.
                    // But to avoid the console error spam from getFallback, we might want to be careful.
                    // Actually, let's just attempt it. The outer try/catch (line 137) catches JSON parse errors, but t() errors might bubble or be logged.
                    // The issue seen in logs is "NextIntl Client Error".
                    
                    // Hack/fix: Only try to translate if we are sure it's a theme.
                    // The excludedThemes list handles the main offenders.
                    themeLabel = t(potentialThemeKey);
                    
                    // Double check if result is same as key (fallback behavior)
                    if (themeLabel === potentialThemeKey) themeLabel = '';
                 } catch (e) {
                    // Ignore missing theme keys
                 }
            }
            
            // Format: "Fourchette : Description"
            const formattedMessage = themeLabel ? `**${themeLabel}** : ${finalMessage}` : finalMessage;
            renderedParts.push(formattedMessage);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    if (renderedParts.length > 0) {
      // Convert markdown bold (**text**) to HTML strong tags
      const fullText = renderedParts.join(' ');
      const splitParts = fullText.split(/(\*\*[^*]+\*\*)/g);
      
      return (
        <span>
          {splitParts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part ? <span key={index}>{part}</span> : null;
          })}
        </span>
      );
    }
  }

  // Fallback: display as-is (legacy format)
  return <span>{description}</span>;
}
