import axiosClient from "./axiosClient";

export async function previewCsv(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await axiosClient.post("/reports/preview_csv/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function bulkSaveReports(items: Array<any>) {
  const res = await axiosClient.post("/reports/bulk_save/", { items });
  return res.data;
}
