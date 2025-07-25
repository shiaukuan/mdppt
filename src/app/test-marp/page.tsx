'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestMarpPage() {
  const [status, setStatus] = useState('開始測試...');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  useEffect(() => {
    const testMarp = async () => {
      try {
        addLog('🔄 開始測試 Marp Core...');
        setStatus('正在載入 Marp Core...');

        // 檢查環境
        addLog(`環境檢查:`);
        addLog(`- 瀏覽器: ${typeof window !== 'undefined' ? '✅' : '❌'}`);
        addLog(`- Document: ${typeof document !== 'undefined' ? '✅' : '❌'}`);
        addLog(`- User Agent: ${navigator.userAgent}`);

        // 嘗試載入 Marp
        addLog('📦 動態載入 @marp-team/marp-core...');
        const { Marp } = await import('@marp-team/marp-core');
        addLog('✅ Marp Core 載入成功');

        // 建立實例
        addLog('🏗️ 建立 Marp 實例...');
        const marp = new Marp({
          html: true,
          math: 'mathjax',
          inlineSVG: false,
        });
        addLog('✅ Marp 實例建立成功');

        // 測試渲染
        addLog('🎬 測試渲染...');
        const markdown =
          '# 測試投影片\n\n這是一個測試投影片。\n\n---\n\n## 第二張投影片\n\n測試成功！';
        const result = marp.render(markdown);
        addLog(`✅ 渲染成功`);
        addLog(`HTML 長度: ${result.html.length}`);
        addLog(`CSS 長度: ${result.css.length}`);

        setStatus('測試完成 - 一切正常！');
        addLog('🎉 所有測試通過！');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知錯誤';
        addLog(`❌ 錯誤: ${errorMessage}`);
        addLog(`錯誤詳情: ${error}`);
        setStatus(`測試失敗: ${errorMessage}`);
      }
    };

    testMarp();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Marp Core 測試</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">測試狀態</h2>
          <div className="text-lg font-medium mb-4">
            狀態:{' '}
            <span
              className={
                status.includes('失敗')
                  ? 'text-red-600'
                  : status.includes('完成')
                    ? 'text-green-600'
                    : 'text-blue-600'
              }
            >
              {status}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">測試記錄</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            重新測試
          </button>
          <Link
            href="/"
            className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded inline-block"
          >
            返回主頁
          </Link>
        </div>
      </div>
    </div>
  );
}
