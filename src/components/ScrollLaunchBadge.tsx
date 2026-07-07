export default function ScrollLaunchBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://www.scrolllaunch.com/products/seenly?utm_source=badge&utm_medium=embed&utm_campaign=seenly&ref=scrolllaunch"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block opacity-80 transition-opacity hover:opacity-100 ${className}`}
    >
      <img
        src="https://www.scrolllaunch.com/api/badge/seenly"
        alt="Featured on ScrollLaunch"
        width={220}
        height={48}
        loading="lazy"
      />
    </a>
  );
}
