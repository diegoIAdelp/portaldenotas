// App sem JSX (usando React.createElement) para funcionar no GitHub Pages sem build
(function() {
  const { useState, useMemo } = React;

  function Header() {
    return React.createElement(
      'header',
      { className: 'header-gradient text-white' },
      React.createElement(
        'div',
        { className: 'max-w-6xl mx-auto px-4 py-6 flex items-center justify-between' },
        [
          React.createElement('h1', { key: 'title', className: 'text-2xl font-semibold' }, 'NoteFlow · Portal de Notas'),
          React.createElement('span', { key: 'badge', className: 'text-sm/none bg-white/20 px-3 py-1 rounded-full' }, 'versão demo')
        ]
      )
    );
  }

  function NFRow({ nf }) {
    return React.createElement(
      'tr',
      { className: 'hover:bg-slate-50' },
      [
        React.createElement('td', { key: 'num', className: 'px-4 py-2' }, nf.numero),
        React.createElement('td', { key: 'forn', className: 'px-4 py-2' }, nf.fornecedor),
        React.createElement('td', { key: 'emissao', className: 'px-4 py-2' }, nf.emissao),
        React.createElement('td', { key: 'valor', className: 'px-4 py-2 text-right' }, nf.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
      ]
    );
  }

  function App() {
    const [filtro, setFiltro] = useState('');
    const [nfs, setNfs] = useState([
      { numero: '000123', fornecedor: 'Fornecedor A', emissao: '2026-01-10', valor: 15320.55 },
      { numero: '000124', fornecedor: 'Fornecedor B', emissao: '2026-01-12', valor: 829.90 },
      { numero: '000125', fornecedor: 'Fornecedor C', emissao: '2026-01-14', valor: 4200.00 }
    ]);

    const filtradas = useMemo(() => {
      const f = filtro.trim().toLowerCase();
      if (!f) return nfs;
      return nfs.filter(x =>
        x.numero.toLowerCase().includes(f) ||
        x.fornecedor.toLowerCase().includes(f)
      );
    }, [filtro, nfs]);

    const total = useMemo(() => filtradas.reduce((acc, x) => acc + x.valor, 0), [filtradas]);

    return React.createElement(
      'main',
      { className: 'max-w-6xl mx-auto px-4 py-6 space-y-6' },
      [
        // Barra de busca e ações
        React.createElement(
          'section',
          { key: 'search', className: 'card p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between' },
          [
            React.createElement('input', {
              key: 'input',
              type: 'text',
              className: 'w-full sm:w-80 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
              placeholder: 'Buscar por número ou fornecedor…',
              value: filtro,
              onChange: (e) => setFiltro(e.target.value)
            }),
            React.createElement('div', { key: 'stats', className: 'text-slate-700 text-sm' }, `Notas: ${filtradas.length} · Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
          ]
        ),

        // Tabela
        React.createElement(
          'section',
          { key: 'table', className: 'card overflow-hidden' },
          [
            React.createElement(
              'table',
              { key: 'tbl', className: 'table w-full' },
              [
                React.createElement(
                  'thead',
                  { key: 'thead', className: 'bg-slate-100' },
                  React.createElement('tr', null, [
                    React.createElement('th', { key: 'h1', className: 'px-4 py-2 text-left' }, 'Número'),
                    React.createElement('th', { key: 'h2', className: 'px-4 py-2 text-left' }, 'Fornecedor'),
                    React.createElement('th', { key: 'h3', className: 'px-4 py-2 text-left' }, 'Emissão'),
                    React.createElement('th', { key: 'h4', className: 'px-4 py-2 text-right' }, 'Valor')
                  ])
                ),
                React.createElement(
                  'tbody',
                  { key: 'tbody' },
                  filtradas.map((nf, i) => React.createElement(NFRow, { nf, key: nf.numero + i }))
                )
              ]
            )
          ]
        )
      ]
    );
  }

  function Root() {
    return React.createElement(React.Fragment, null, [
      React.createElement(Header, { key: 'h' }),
      React.createElement(App, { key: 'a' })
    ]);
  }

  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(Root));
})();
