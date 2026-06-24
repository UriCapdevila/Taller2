export function getStoryTitleClass(title = '') {
  const length = title.trim().length;

  if (length >= 64) {
    return 'story-title--compact';
  }

  if (length >= 46) {
    return 'story-title--long';
  }

  return '';
}
