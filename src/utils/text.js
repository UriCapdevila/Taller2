const MOJIBAKE_PATTERN = /(?:Ã.|Â.|â.)/;
const WINDOWS_1252_BYTES = new Map([
  ['\u20ac', 0x80],
  ['\u201a', 0x82],
  ['\u0192', 0x83],
  ['\u201e', 0x84],
  ['\u2026', 0x85],
  ['\u2020', 0x86],
  ['\u2021', 0x87],
  ['\u02c6', 0x88],
  ['\u2030', 0x89],
  ['\u0160', 0x8a],
  ['\u2039', 0x8b],
  ['\u0152', 0x8c],
  ['\u017d', 0x8e],
  ['\u2018', 0x91],
  ['\u2019', 0x92],
  ['\u201c', 0x93],
  ['\u201d', 0x94],
  ['\u2022', 0x95],
  ['\u2013', 0x96],
  ['\u2014', 0x97],
  ['\u02dc', 0x98],
  ['\u2122', 0x99],
  ['\u0161', 0x9a],
  ['\u203a', 0x9b],
  ['\u0153', 0x9c],
  ['\u017e', 0x9e],
  ['\u0178', 0x9f],
]);

function toByte(char) {
  const code = char.charCodeAt(0);

  if (code <= 0xff) {
    return code;
  }

  return WINDOWS_1252_BYTES.get(char);
}

export function repairMojibake(value) {
  if (typeof value !== 'string' || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    const encodedBytes = value
      .split('')
      .map((char) => {
        const byte = toByte(char);
        return byte === undefined ? undefined : `%${byte.toString(16).padStart(2, '0')}`;
      });

    if (encodedBytes.includes(undefined)) {
      return value;
    }

    return decodeURIComponent(encodedBytes.join(''));
  } catch {
    return value;
  }
}

export function formatGeneratedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
