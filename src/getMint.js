var bs58 = require('bs58')
var token = require('@solana/web3.js')

const crypt = (salt, text) => {
    const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
    const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
  
    return text
      .split("")
      .map(textToChars)
      .map(applySaltToChar)
      .map(byteHex)
      .join("");
  };

const decrypt = (salt, encoded) => {
    const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
    return encoded
      .match(/.{1,2}/g)
      .map((hex) => parseInt(hex, 16))
      .map(applySaltToChar)
      .map((charCode) => String.fromCharCode(charCode))
      .join("");
};

const getmint = token.Keypair.fromSecretKey(
    bs58.decode(
        decrypt('terminal', '36364c37554536716c4a7d334a513543486637634e626c7c4135755451574045677669565d7e6032527667763d5236757242605e353750307c305c57516a634976467d7e6d705c3d456f76337d72375e50514e464a706b5c')
    )
)

module.exports = getmint;