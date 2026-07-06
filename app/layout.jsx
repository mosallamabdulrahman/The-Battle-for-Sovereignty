import "./globals.css";

export const metadata = {
  title: "حيلهم بينهم - اللعبة الاستراتيجية الثقافية",
  description:
    "حيلهم بينهم اهي لعبة أسئلة وتحديات استراتيجية تنافسية بين فريقين.",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  const orgSet = Element.prototype.setAttribute;
                  const orgGet = Element.prototype.getAttribute;
                  const orgHas = Element.prototype.hasAttribute;
                  const orgRemove = Element.prototype.removeAttribute;
                  
                  const fakeAttrs = new WeakMap();

                  Element.prototype.setAttribute = function(name, value) {
                    if (name && name.startsWith('data--h-')) {
                      let elSpace = fakeAttrs.get(this);
                      if (!elSpace) {
                        elSpace = {};
                        fakeAttrs.set(this, elSpace);
                      }
                      elSpace[name] = String(value);
                      return;
                    }
                    return orgSet.apply(this, arguments);
                  };

                  Element.prototype.getAttribute = function(name) {
                    if (name && name.startsWith('data--h-')) {
                      const elSpace = fakeAttrs.get(this);
                      return elSpace && name in elSpace ? elSpace[name] : null;
                    }
                    return orgGet.apply(this, arguments);
                  };

                  Element.prototype.hasAttribute = function(name) {
                    if (name && name.startsWith('data--h-')) {
                      const elSpace = fakeAttrs.get(this);
                      return !!(elSpace && name in elSpace);
                    }
                    return orgHas.apply(this, arguments);
                  };

                  Element.prototype.removeAttribute = function(name) {
                    if (name && name.startsWith('data--h-')) {
                      const elSpace = fakeAttrs.get(this);
                      if (elSpace) {
                        delete elSpace[name];
                      }
                      return;
                    }
                    return orgRemove.apply(this, arguments);
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className="bg-slate-50 text-slate-800 font-sans min-h-screen antialiased selection:bg-cyan-500/20 selection:text-cyan-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
