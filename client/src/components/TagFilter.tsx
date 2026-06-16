const AVAILABLE_TAGS = [
  '全部',
  'algorithm',
  'design',
  'es6',
  'git',
  'http',
  'javascript',
  'css',
  'NodeJS',
  'React',
  'vue',
  'Vue3',
  'Typescript',
  'webpack',
];

export default function TagFilter({
  currentTag,
  onTagChange,
}: {
  currentTag: string;
  onTagChange: (tag: string) => void;
}) {
  const handleClick = (tag: string) => {
    onTagChange(tag === '全部' ? '' : tag);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {AVAILABLE_TAGS.map((tag) => {
        const isActive = tag === '全部' ? currentTag === '' : currentTag === tag;
        return (
          <button
            key={tag}
            onClick={() => handleClick(tag)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium tracking-wide transition-all duration-200 ${
              isActive
                ? 'bg-[var(--color-tag-active-bg)] text-[var(--color-tag-active-text)] shadow-sm'
                : 'text-[var(--color-tag-inactive-text)] hover:text-[var(--color-tag-hover-text)] hover:bg-[var(--color-tag-hover-bg)]'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
