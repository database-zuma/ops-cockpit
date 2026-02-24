/**
 * Format number as IDR currency
 * @param value - Number to format
 * @param compact - If true, use compact format (e.g., "Rp 1,5 jt"), else full (e.g., "Rp 1.500.000")
 * @returns Formatted IDR string
 */
export function formatIDR(value: number, compact = false): string {
  if (compact) {
    return formatCompactIDR(value);
  }

  // Full format: Rp 1.500.000 (dot as thousands separator, no decimals)
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return formatted;
}

/**
 * Format number as compact IDR (e.g., "Rp 1,5 jt")
 */
function formatCompactIDR(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    // Miliar (billion)
    const num = absValue / 1_000_000_000;
    const formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}Rp ${formatted} M`;
  }

  if (absValue >= 1_000_000) {
    // Juta (million)
    const num = absValue / 1_000_000;
    const formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}Rp ${formatted} jt`;
  }

  if (absValue >= 1_000) {
    // Ribu (thousand)
    const num = absValue / 1_000;
    const formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}Rp ${formatted} rb`;
  }

  return `${sign}Rp ${absValue.toLocaleString('id-ID')}`;
}

/**
 * Format number as percentage
 * @param value - Number to format (can be 0-1 or 0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "75.5%")
 */
export function formatPct(value: number, decimals = 1): string {
  // If value is between 0 and 1, assume it's a fraction
  if (value >= 0 && value <= 1) {
    value = value * 100;
  }

  return `${value.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Format number in compact form (e.g., 1500000 → "1,5jt", 1000 → "1rb")
 * @param value - Number to format
 * @returns Formatted compact string
 */
export function formatCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    // Miliar (billion)
    const num = absValue / 1_000_000_000;
    const formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}${formatted}M`;
  }

  if (absValue >= 1_000_000) {
    // Juta (million)
    const num = absValue / 1_000_000;
    const formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}${formatted}jt`;
  }

  if (absValue >= 1_000) {
    // Ribu (thousand)
    const num = absValue / 1_000;
    const formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}${formatted}rb`;
  }

  return `${sign}${absValue.toLocaleString('id-ID')}`;
}

/**
 * Format pairs count with "psg" suffix
 * @param value - Number of pairs
 * @returns Formatted string (e.g., "1.234 psg")
 */
export function formatPairs(value: number): string {
  const formatted = value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} psg`;
}

/**
 * Format delta with sign and percentage
 * @param value - Delta value (can be 0-1 or 0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted delta string (e.g., "+5.2%", "-3.1%")
 */
export function formatDelta(value: number, decimals = 1): string {
  // If value is between 0 and 1, assume it's a fraction
  let displayValue = value;
  if (value >= -1 && value <= 1 && value !== 0) {
    displayValue = value * 100;
  }

  const sign = displayValue > 0 ? '+' : '';
  const formatted = displayValue.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}${formatted}%`;
}
