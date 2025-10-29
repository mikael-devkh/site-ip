import { FormEvent, useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Loader2, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, profile, loadingAuth, loadingProfile, refreshProfile, updateProfileLocally } =
    useAuth();
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? "");
      setMatricula(profile.matricula ?? "");
    } else {
      setNome("");
      setMatricula("");
    }
  }, [profile]);

  useEffect(() => {
    if (!loadingAuth && user && !profile && !loadingProfile) {
      void (async () => {
        try {
          const snapshot = await getDoc(doc(db, "users", user.uid));
          if (snapshot.exists()) {
            const data = snapshot.data();
            setNome(typeof data.nome === "string" ? data.nome : "");
            setMatricula(typeof data.matricula === "string" ? data.matricula : "");
            updateProfileLocally({
              nome: typeof data.nome === "string" ? data.nome : undefined,
              matricula: typeof data.matricula === "string" ? data.matricula : undefined,
            });
          }
        } catch (error) {
          console.error("Erro ao buscar dados do perfil:", error);
        }
      })();
    }
  }, [loadingAuth, loadingProfile, profile, updateProfileLocally, user]);

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const profileRef = doc(db, "users", user.uid);
      await setDoc(
        profileRef,
        {
          email: user.email ?? "",
          nome: nome.trim(),
          matricula: matricula.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      updateProfileLocally({ nome: nome.trim(), matricula: matricula.trim() });
      toast.success("Perfil salvo com sucesso. Suas RATs usarão estes dados automaticamente.");
      await refreshProfile();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Não foi possível salvar as informações do perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-primary px-4 py-8 pt-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <header className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-2xl bg-secondary p-3 shadow-glow">
              <UserCog className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Meu Perfil de Atendimento
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Guarde seu nome e matrícula para preencher automaticamente o formulário de RAT e
              agilizar cada atendimento.
            </p>
          </header>

          <Card className="bg-background/90 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground sm:text-xl">
                Informações do prestador
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>E-mail corporativo</Label>
                  <Input value={user.email ?? ""} readOnly disabled />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    placeholder="Ex: Maria Souza"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="matricula">Matrícula ou RG</Label>
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(event) => setMatricula(event.target.value)}
                    placeholder="Ex: 123456"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="submit" className="gap-2" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar perfil
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

