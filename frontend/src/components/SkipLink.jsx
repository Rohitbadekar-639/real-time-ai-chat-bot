export default function SkipLink({ href = "#main-content" }) {
  return (
    <a className="skip-link" href={href}>
      Skip to main content
    </a>
  );
}
