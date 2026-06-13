
## 摘要理解
长期记忆，重要
目前方案，依靠任务向量化和检索，存在上下文爆炸和效果不佳
思考，提出，独立于任务的插件记忆模块
动机来源：
与决策高度相关信息存在抽象知识中，而不是内容记忆
因此，借鉴，认知科学理论，将情境记忆结构化为一个紧凑、可扩展的以知识为中心的
记忆图谱，这个图谱表示了陈述性知识和程序性知识
意义：实现了对任务相关知识的高效检索，他与图rag的不同，他将知识作为记忆访问和组织的基本单元
不是文本块

benchmark：长程对话问答、多跳知识检索和 Web 智能体任务

## intro
论文从认知可续汲取灵感。人类大脑在组织上对情境记忆和知识记忆进行了根本区分
知识记忆进一步分为如下：
- 语义记忆：知道什么，即事实命题
- 程序记忆：怎么做，面向行动的指引
情境记忆是知识抽象的源泉，而语义和程序记忆则是最直接用于推理和决策的形式。

plugmem的架构与创新
基于以上原理，论文推出PLUGMEM，他是一个通用的记忆backbone，包含三个核心模块
1.结构化模块：将异构的原始交互轨迹标准化，通过分层抽象提取出成述性知识和程序性知识
构建。
区别于 GraphRAG： 传统图方法以“实体”或“文本块”为单位，而 PLUGMEM 以知识单元（Knowledge units）作为记忆访问和组织的基本单元。
检索模块：选择与当前任务相关的子图，他采用一种抽象-具体交错的策略
3 推理模块：测试运行时，将检索到的知识进一步的自适应和压缩聚合，提炼出最精简无冗余的行动指南


评估框架与实验结果：
效用-成本分析框架（Utility-Cost Analysis）： 引入了信息论指标（Memory Information Density，位/Token），不仅能量化记忆带来的性能提升（效用），还能精准计算其对上下文窗口的消耗（成本）。

实验表现： 在长程对话问答（LongMemEval）、多跳知识检索（HotpotQA）和网页智能体（WebArena）三个完全不同的异构基准测试中，PLUGMEM 在不进行任何任务特定修改的前提下，不仅一致优于其他通用基线，甚至超越了那些针对特定任务定制的记忆设计，同时将记忆 Token 的消耗降低了一到两个数量级（见图 1 的理想走向：高收益、低成本）。

## code学习
架构：
agent(obs,action)
[LLM 结构化管道] → 提取子目标/奖励/语义事实/流程经验
[MemoryGraph] → 5种节点类型写入 ChromaDB
[ChromaDB 向量库] ← 余弦相似度检索

核心组件
存储，chromadb,说明：6个集合/图，5个 节点+1个审核日志
嵌入：nv-embed-v2，openai，本地确定性回退，4096维度
llmprovider配置
记忆类型，语义/程序/情节/+标签+子目标，5种节点，图结构关联
检索：余弦相似度+标签投票+价值函数评分，两阶段检索+LLM推理

根目录
plugmem/：核心记忆系统逻辑
src/基准评测评估代码
assets/使用图片
examples/任务适配示例
scripts/实验脚本
host_local_inference/本地推理服务
tests/单元测试

plugmem/核心库
core/记忆引擎
- graph_node.py:5种节点定义
- memory.py Memroy类，将原始的(obs,action)步骤通过llm结构化
- mem graph.py 记忆图，插入检索推理合并总调度器
- value-base.py 价值函数抽象基
- value-functions.py 具体价值函数，相关性评分策略
- normalize.py 记忆数据格式归一化
clients/ 外部服务客户端
- llm.py llm调用封装
- llm_router.py llm路由器
- embeding.py 嵌入客户端

storage/持久化层
- chroma.py 封装

prompts/提示词系统
- structuring.py 结构化提示
- retriveing.py 检索提示
- reasoning.py 推理提示
- registry.py 4层提示解析
- base.py 提示模版基类

api/fastapi服务+mem ui
- app.py fastapi应用工厂
- routes/graphs 图的crud
- routes/memroies.py 记忆插入两种模式，trajectory/structed
- routes/retrieval.py 检索+推理+语义整合
- routes/inspector.py 只读查询端点
- routes/demo.py 演示
- routes/health.py 健康检查
- dependencies.py 依赖注入
- auth.py api-key认证
- static/inspector 前端
