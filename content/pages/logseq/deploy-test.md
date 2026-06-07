---
title: "测试：一键部署脚本 deploy.sh"
date: 2026-06-07
tags: ["test", "deploy", "自动化"]
categories: ["技术"]
draft: false
---

这是一篇**自动测试文章**，验证 `deploy.sh` 无参发布流程是否正常工作。

## 测试流程

```
写 md → bash deploy.sh → 自动构建 → git push → GitHub Actions → 上线
```

## 验证清单

- [x] Hugo 构建无报错
- [x] Git 自动提交
- [x] GitHub Actions 触发部署
- [ ] 博客页面可访问

---

> 如果能看到这篇文章，说明整个自动化链路跑通了 🎉
