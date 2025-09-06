export function decodePurchaseCode(raw: string): { value: number; valid: boolean } {
    const CODE_MAP: Record<string, string> = {
      D: "1", I: "2", N: "3", E: "4", S: "5", H: "6", J: "7", A: "8", T: "9", P: "0",
    }
    const code = raw.toUpperCase().replace(/\s+/g, "")
    if (!code) return { value: 0, valid: false }

    let out = ""
    for (const ch of code) {
      if (!(ch in CODE_MAP)) {
        return { value: 0, valid: false }
      }
      out += CODE_MAP[ch]
    }
    const num = out.replace(/^0+/, "") || "0"
    return { value: Number(num), valid: true }
  }
