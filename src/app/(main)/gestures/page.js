"use client";
import dynamic from 'next/dynamic';

const GesturesMainComponent = dynamic(
  () => import('@/app/(main)/gestures/mainComponent.js'), 
  { ssr: false }
);

export default function GesturesPage() {
  return <GesturesMainComponent />;
}
