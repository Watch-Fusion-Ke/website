import Link from "next/link";

// What the shopper sees while Wix sends them back and the sign-in is finished.
const LoginCallbackView = ({ message }: { message?: string }) => (
  <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
    {message ? (
      <>
        <h1 className="font-display text-2xl font-bold">We could not log you in</h1>
        <p role="alert" className="text-sm text-gray-700">
          {message}
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-brand-navy px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          Back to log in
        </Link>
      </>
    ) : (
      <>
        <h1 className="font-display text-2xl font-bold">Logging you in</h1>
        <p role="status" className="text-sm text-gray-700">
          One moment. We are finishing signing you in.
        </p>
      </>
    )}
  </div>
);

export default LoginCallbackView;
