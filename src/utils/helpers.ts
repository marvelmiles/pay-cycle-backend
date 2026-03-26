export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const paginate = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};
