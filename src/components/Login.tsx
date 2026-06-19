              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  id="senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>

            {erro && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setModalRecuperar(true)}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-500 text-sm">
              Acesso de demonstração:
              <br />
              admin@erp.com / admin123
            </p>
          </div>
        </div>
      </div>

      {modalRecuperar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recuperar Senha</h2>
              <button
                onClick={() => setModalRecuperar(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-slate-400 mb-6">
              Informe seu e-mail cadastrado e enviaremos instruções para recuperação de senha.
            </p>

            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {mensagemRecuperacao && (
                <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-lg border border-green-800">
                  <Send className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{mensagemRecuperacao}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Enviar E-mail de Recuperação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
