# Android APK তৈরি করা

এই প্রজেক্টে `android/` ফোল্ডারে একটি সম্পূর্ণ, বিল্ড-রেডি Android (WebView) র‍্যাপার তৈরি করা আছে —
এটি আপনার React অ্যাপটিকে (ইতিমধ্যে `android/app/src/main/assets/www/` এ কপি করা আছে) একটি
নেটিভ Android অ্যাপ হিসেবে চালায়।

**কেন আমি নিজে .apk ফাইলটা বানিয়ে দিতে পারিনি:** APK কম্পাইল করতে Android SDK এবং Google/Maven-এর
সার্ভার থেকে বড় বড় লাইব্রেরি ডাউনলোড করা লাগে (কয়েকশ MB)। এই ক্লাউড ওয়ার্কস্পেসের নেটওয়ার্ক নিরাপত্তার
কারণে ওই সার্ভারগুলোতে (dl.google.com, maven.google.com ইত্যাদি) সরাসরি প্রবেশ করা যায় না। তাই পুরো
প্রজেক্টটা বিল্ড-রেডি অবস্থায় বানিয়ে দিয়েছি — নিচের যেকোনো একটা উপায়ে আপনি নিজে (অথবা GitHub) এক
ক্লিকেই APK বানিয়ে নিতে পারবেন।

## উপায় ১: Android Studio দিয়ে (সবচেয়ে সহজ, সুপারিশকৃত)

1. [Android Studio](https://developer.android.com/studio) ইনস্টল করুন (ফ্রি)।
2. Android Studio খুলুন → **Open** → এই প্রজেক্টের `android` ফোল্ডারটি সিলেক্ট করুন
   (পুরো প্রজেক্ট ফোল্ডার না, শুধু ভিতরের `android` ফোল্ডার)।
3. প্রথমবার খোলার সময় Android Studio নিজে থেকেই দরকারি SDK ও লাইব্রেরি ডাউনলোড করে নেবে
   ("Gradle Sync" — কয়েক মিনিট লাগতে পারে, ইন্টারনেট লাগবে)।
4. সিঙ্ক শেষ হলে উপরের মেনু থেকে: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**
5. বিল্ড শেষ হলে একটা নোটিফিকেশন আসবে — "locate" লিংকে ক্লিক করলে
   `android/app/build/outputs/apk/debug/app-debug.apk` ফাইলটা পাবেন।
6. এই `.apk` ফাইলটা আপনার ফোনে পাঠিয়ে ইনস্টল করুন (প্রথমবার "Install from unknown sources"
   অনুমতি দিতে হতে পারে)।

## উপায় ২: GitHub Actions দিয়ে (কম্পিউটারে কিছু ইনস্টল না করেই)

এই প্রজেক্টে `.github/workflows/android-build.yml` নামে একটা তৈরি ওয়ার্কফ্লো আছে।

1. এই প্রজেক্টটা আপনার নিজের GitHub রিপোজিটরিতে পুশ করুন।
2. রিপোর **Settings → Secrets and variables → Actions** এ গিয়ে দুইটা secret যোগ করুন:
   - `VITE_SUPABASE_URL` = `https://giymjealpcvchjjgsdyw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (আপনার `.env.local` ফাইলে থাকা anon key)
3. **Actions** ট্যাবে যান → "Build Android APK" ওয়ার্কফ্লো সিলেক্ট করুন → **Run workflow**।
4. ৩-৫ মিনিট পর বিল্ড শেষ হলে ফলাফলের নিচে **Artifacts** সেকশনে `tgs-ledger-debug-apk` নামে
   একটা zip পাবেন — সেটার ভিতরে `app-debug.apk`।

## অ্যাপ কোড পরিবর্তন করলে

যদি পরে React কোডে (src/) কোনো পরিবর্তন করেন, নতুন করে APK বানানোর আগে ওয়েব বিল্ডটা
Android অ্যাসেটে আবার কপি করে দিতে হবে:

```bash
npm run build
rm -rf android/app/src/main/assets/www
mkdir -p android/app/src/main/assets/www
cp -r dist/* android/app/src/main/assets/www/
```

(GitHub Actions ওয়ার্কফ্লো এই ধাপগুলো প্রতিবার নিজে থেকেই করে, তাই সেটা ব্যবহার করলে
আপনাকে ম্যানুয়ালি এটা করতে হবে না।)

## গুরুত্বপূর্ণ নোট

- এই APK-টি **সাইন করা (signed) release** না, এটা একটা **debug** বিল্ড — নিজের ফোনে টেস্ট করার
  জন্য ইনস্টল করা যাবে, কিন্তু Google Play Store-এ আপলোড করতে চাইলে আলাদাভাবে একটা release
  keystore দিয়ে সাইন করতে হবে (Android Studio-তে **Build → Generate Signed Bundle / APK**)।
- অ্যাপের ইন্টারনেট পারমিশন (`INTERNET`) আগে থেকেই `AndroidManifest.xml`-এ যোগ করা আছে,
  তাই Supabase-এর সাথে লগইন ও সিঙ্ক ঠিকমতো কাজ করবে।
