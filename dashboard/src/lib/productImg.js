export function productImg(id, size = 200) {
  if (!id) return null;
  return `https://www.ebag.bg/products/${id}/images/0/${size}/webp`;
}
