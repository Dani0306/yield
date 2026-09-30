import styles from "./Loader.module.css";

const Loader = ({ label }: { label?: string }) => {
  return (
    <div role="status" className="flex flex-col items-center gap-6">
      <div aria-hidden className={styles.spinner}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} />
        ))}
      </div>
      {label ? (
        <span className="text-xs font-light text-gray-700">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
};

export default Loader;
