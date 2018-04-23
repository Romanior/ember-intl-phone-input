export default function(value) {
  return value && value.replace(/[\s-+()]/g, '');
}
