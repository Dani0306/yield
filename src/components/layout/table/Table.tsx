"use client";

import { useMediaQuery } from "usehooks-ts";
import DesktopTable from "./DesktopTable";
import MobileTable from "./MobileTable";
import type { TableProps } from "./types";

export type { TableColumn, TableProps } from "./types";

const Table = <T,>(props: TableProps<T>) => {
  const isMobile = useMediaQuery("(max-width: 767px)", {
    initializeWithValue: false,
  });

  return isMobile ? <MobileTable {...props} /> : <DesktopTable {...props} />;
};

export default Table;
