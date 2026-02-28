export function validateJson(jsonString: string): Record<string, string> {
  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format');
  }
}

export function validateJwtToken(token: string): void {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token format! Token must have 3 parts separated by dots.');
  }

  try {
    JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('JWT token has expired. Please refresh your token.');
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('JWT token')) {
      throw e;
    }
    throw new Error('Invalid JWT token format! Unable to decode token structure.');
  }
}
