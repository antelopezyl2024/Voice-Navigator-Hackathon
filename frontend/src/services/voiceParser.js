export const COMMANDS = {
  SHOW_GDP: 'SHOW_GDP',
  SHOW_CO2: 'SHOW_CO2',
  SHOW_AGRI: 'SHOW_AGRI',
  DESCRIBE_CO2: 'DESCRIBE_CO2',
  SHOW_DOW: 'SHOW_DOW',
  FREE_QUERY: 'FREE_QUERY',
};

export function parseVoiceCommand(text) {
  if (!text) return { command: COMMANDS.FREE_QUERY, raw: text };
  const lower = text.toLowerCase();

  if (lower.includes('gdp') || lower.includes('gross domestic') || lower.includes('growth')) {
    return { command: COMMANDS.SHOW_GDP, raw: text };
  }
  if ((lower.includes('co2') || lower.includes('carbon') || lower.includes('emission') || lower.includes('dioxide')) && (lower.includes('descri') || lower.includes('explain') || lower.includes('tell') || lower.includes('what'))) {
    return { command: COMMANDS.DESCRIBE_CO2, raw: text };
  }
  if (lower.includes('co2') || lower.includes('carbon') || lower.includes('emission') || lower.includes('dioxide')) {
    return { command: COMMANDS.SHOW_CO2, raw: text };
  }
  if (lower.includes('agri') || lower.includes('agricultural') || lower.includes('farming') || lower.includes('land') || lower.includes('crop')) {
    return { command: COMMANDS.SHOW_AGRI, raw: text };
  }
  if (lower.includes('dow') || lower.includes('stock') || lower.includes('top 10') || lower.includes('market')) {
    return { command: COMMANDS.SHOW_DOW, raw: text };
  }
  return { command: COMMANDS.FREE_QUERY, raw: text };
}
