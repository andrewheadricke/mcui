function convertSnr(snr: number) {
  let signedSnr
  if (snr > 127) {
    signedSnr = snr - 256
  } else {
    signedSnr = snr
  }
  //console.log(signedSnr)
  return signedSnr / 4.0
}

function encodeSnr(snr: number) {
  // 1. Multiply back to get signed byte
  let signedSnr = snr * 4.0;
  
  // 2. Handle negative values to bring them back to 0-255 range
  if (signedSnr < 0) {
    return signedSnr + 256;
  } else {
    return signedSnr;
  }
}

export {
  convertSnr,
  encodeSnr
}