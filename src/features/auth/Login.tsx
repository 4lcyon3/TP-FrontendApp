import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/AuthContext";

interface School {
  id: number;
  fullname: string;
}

const Login: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showSchoolMenu, setShowSchoolMenu] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/schools/")
      .then((res) => setSchools(res.data))
      .catch(() => console.error("No se pudieron cargar los colegios."));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSchool) {
      alert("Seleccione un colegio antes de continuar.");
      return;
    }
    console.log("Token guardado correctamente");
    const ok = await login(
      form.username,
      form.password,
      selectedSchool.fullname
    );

    if (ok) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Appweb – Login
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">

            <div>
              <p className="mb-1 font-medium">Usuario</p>
              <Input
                placeholder="Ingrese su usuario"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block">
                <span className="mb-1 font-medium">
                  Contraseña
                </span>

                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.287.244-2.514.675-3.648M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
            </div>

            <div className="relative">
              <p className="mb-1 font-medium">Colegio</p>

              <div
                className="border rounded-lg p-2 cursor-pointer bg-white dark:bg-gray-800"
                onClick={() => setShowSchoolMenu(!showSchoolMenu)}
              >
                {selectedSchool ? selectedSchool.fullname : "Seleccione un colegio"}
              </div>

              {showSchoolMenu && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg">
                  <Command>
                    <CommandInput placeholder="Buscar colegio..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>

                      <CommandGroup>
                        {schools.map((school) => (
                          <CommandItem
                            key={school.id}
                            onSelect={() => {
                              setSelectedSchool(school);
                              setShowSchoolMenu(false);
                            }}
                          >
                            {school.fullname}
                          </CommandItem>
                        ))}
                      </CommandGroup>

                    </CommandList>
                  </Command>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="flex justify-center mt-2">
              <Button
                className="w-1/2 text-lg py-2"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 11-8 8z"
                    ></path>
                  </svg>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </div>

            {/* Olvidó contraseña */}
            <div className="text-center mt-3">
              <button
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                onClick={() => setOpenDialog(true)}
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Modal - Recuperar contraseña */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Recuperar contraseña
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Para solicitar una nueva contraseña, comuníquese con la dirección
            de su institución.
          </p>

          <div className="mt-4 flex justify-end">
            <Button className="px-4" onClick={() => setOpenDialog(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
