// main.js
console.log("[UniTV] Script carregado com sucesso!");

// --- Assistente IA Gemini ---
async function perguntarIA(pergunta) {
  // Rota segura no backend (não coloque sua chave diretamente aqui!)
  const endpoint = "https://seudominio.com/api/gemini";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: pergunta }] }]
    })
  });

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui gerar uma resposta agora 😅";
}

// --- Interação com o usuário ---
document.addEventListener("DOMContentLoaded", () => {
  const perguntaInput = document.getElementById("user-question");
  const botaoPerguntar = document.getElementById("ask-ia-btn");
  const respostaDiv = document.getElementById("ia-response");

  botaoPerguntar.addEventListener("click", async () => {
    const pergunta = perguntaInput.value.trim();
    if (!pergunta) return;

    respostaDiv.textContent = "⏳ Pensando...";
    respostaDiv.classList.remove("hidden");

    try {
      const resposta = await perguntarIA(pergunta);
      respostaDiv.textContent = resposta;
    } catch {
      respostaDiv.textContent = "⚠️ Erro ao conectar com a IA. Tente novamente mais tarde.";
    }
  });
});
