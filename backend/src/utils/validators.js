const isValidUuid = (value) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
};

const isPdfMimeType = (mimeType) => {
  return mimeType === "application/pdf";
};

const isPositiveInteger = (value) => {
  return Number.isInteger(value) && value > 0;
};

module.exports = {
  isValidUuid,
  isPdfMimeType,
  isPositiveInteger,
};
