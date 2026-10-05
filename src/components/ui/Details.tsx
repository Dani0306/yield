// Building blocks for detail modals: a section heading and label/value rows
// (wrap the rows in a <dl>).

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="pb-3 text-sm font-medium text-black">{children}</h3>
);

export const Detail = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="flex items-baseline gap-4 border-b border-gray-200 py-3">
    <dt className="w-36 shrink-0 text-xs text-gray-500">{label}</dt>
    <dd className={`min-w-0 text-sm text-black ${mono ? "font-mono" : ""}`}>
      {value}
    </dd>
  </div>
);
