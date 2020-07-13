import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: any }> = { [K in keyof T]: T[K] };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type MailboxSyncStatus = {
  __typename?: 'MailboxSyncStatus';
  id: Scalars['ID'];
  userId: Scalars['String'];
  createdAt: Scalars['Int'];
  updatedAt: Scalars['Int'];
  status: JobStatus;
  stats?: Maybe<JobCounters>;
};

export type JobCounters = {
  __typename?: 'JobCounters';
  downloadMessage: JobStats;
  syncMailbox: JobStats;
  analyzeMessage: JobStats;
};

export type JobStats = {
  __typename?: 'JobStats';
  UNKNOWN: Scalars['Int'];
  NOT_STARTED: Scalars['Int'];
  COMPLETED: Scalars['Int'];
  IN_PROGRESS: Scalars['Int'];
  FAILED: Scalars['Int'];
};

export enum JobStatus {
  Unknown = 'UNKNOWN',
  Completed = 'COMPLETED',
  NotStarted = 'NOT_STARTED',
  InProgress = 'IN_PROGRESS',
  Failed = 'FAILED'
}

export type LinkDetection = {
  __typename?: 'LinkDetection';
  type: LinkType;
  href: Scalars['String'];
  firstCharPos: Scalars['Int'];
};

export type TrackerDetection = {
  __typename?: 'TrackerDetection';
  type: TrackerType;
  domain: Scalars['String'];
  href: Scalars['String'];
  firstCharPos: Scalars['Int'];
};

export enum TrackerType {
  Unknown = 'UNKNOWN',
  Onebyone = 'ONEBYONE'
}

export enum LinkType {
  Unknown = 'UNKNOWN',
  GoogleDocs = 'GOOGLE_DOCS',
  GoogleDrive = 'GOOGLE_DRIVE'
}

export type LinkData = {
  __typename?: 'LinkData';
  results: Array<LinkDetection>;
};

export type TrackingData = {
  __typename?: 'TrackingData';
  results: Array<TrackerDetection>;
};

export type AnalysisData = TrackingData | LinkData;

export type Result = {
  __typename?: 'Result';
  id: Scalars['ID'];
  messageId: Scalars['String'];
  data: AnalysisData;
};

export type ResultsPage = {
  __typename?: 'ResultsPage';
  results: Array<Result>;
  nextToken?: Maybe<Scalars['Int']>;
};

export type MessagePreview = {
  __typename?: 'MessagePreview';
  subject: Scalars['String'];
  from: Scalars['String'];
  to: Scalars['String'];
  snippet: Scalars['String'];
};

export type MailboxQueries = {
  __typename?: 'MailboxQueries';
  getMailboxSyncStatus: MailboxSyncStatus;
  getMailboxSyncStats?: Maybe<JobCounters>;
  getResultsPage: ResultsPage;
  getMessagePreview?: Maybe<MessagePreview>;
};


export type MailboxQueriesGetMailboxSyncStatsArgs = {
  jobId: Scalars['ID'];
};


export type MailboxQueriesGetResultsPageArgs = {
  token?: Maybe<Scalars['Int']>;
  analysisType?: Maybe<Scalars['String']>;
};


export type MailboxQueriesGetMessagePreviewArgs = {
  messageId: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  mailbox: MailboxQueries;
};

export type Mutation = {
  __typename?: 'Mutation';
  mailbox: MailboxMutations;
};

export type MailboxMutations = {
  __typename?: 'MailboxMutations';
  syncMailbox: Scalars['Boolean'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  MailboxSyncStatus: ResolverTypeWrapper<MailboxSyncStatus>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  JobCounters: ResolverTypeWrapper<JobCounters>;
  JobStats: ResolverTypeWrapper<JobStats>;
  JobStatus: JobStatus;
  LinkDetection: ResolverTypeWrapper<LinkDetection>;
  TrackerDetection: ResolverTypeWrapper<TrackerDetection>;
  TrackerType: TrackerType;
  LinkType: LinkType;
  LinkData: ResolverTypeWrapper<LinkData>;
  TrackingData: ResolverTypeWrapper<TrackingData>;
  AnalysisData: ResolversTypes['TrackingData'] | ResolversTypes['LinkData'];
  Result: ResolverTypeWrapper<Omit<Result, 'data'> & { data: ResolversTypes['AnalysisData'] }>;
  ResultsPage: ResolverTypeWrapper<ResultsPage>;
  MessagePreview: ResolverTypeWrapper<MessagePreview>;
  MailboxQueries: ResolverTypeWrapper<MailboxQueries>;
  Query: ResolverTypeWrapper<{}>;
  Mutation: ResolverTypeWrapper<{}>;
  MailboxMutations: ResolverTypeWrapper<MailboxMutations>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  MailboxSyncStatus: MailboxSyncStatus;
  ID: Scalars['ID'];
  String: Scalars['String'];
  Int: Scalars['Int'];
  JobCounters: JobCounters;
  JobStats: JobStats;
  LinkDetection: LinkDetection;
  TrackerDetection: TrackerDetection;
  LinkData: LinkData;
  TrackingData: TrackingData;
  AnalysisData: ResolversParentTypes['TrackingData'] | ResolversParentTypes['LinkData'];
  Result: Omit<Result, 'data'> & { data: ResolversParentTypes['AnalysisData'] };
  ResultsPage: ResultsPage;
  MessagePreview: MessagePreview;
  MailboxQueries: MailboxQueries;
  Query: {};
  Mutation: {};
  MailboxMutations: MailboxMutations;
  Boolean: Scalars['Boolean'];
}>;

export type MailboxSyncStatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['MailboxSyncStatus'] = ResolversParentTypes['MailboxSyncStatus']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['JobStatus'], ParentType, ContextType>;
  stats?: Resolver<Maybe<ResolversTypes['JobCounters']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type JobCountersResolvers<ContextType = any, ParentType extends ResolversParentTypes['JobCounters'] = ResolversParentTypes['JobCounters']> = ResolversObject<{
  downloadMessage?: Resolver<ResolversTypes['JobStats'], ParentType, ContextType>;
  syncMailbox?: Resolver<ResolversTypes['JobStats'], ParentType, ContextType>;
  analyzeMessage?: Resolver<ResolversTypes['JobStats'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type JobStatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['JobStats'] = ResolversParentTypes['JobStats']> = ResolversObject<{
  UNKNOWN?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  NOT_STARTED?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  COMPLETED?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  IN_PROGRESS?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  FAILED?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type LinkDetectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['LinkDetection'] = ResolversParentTypes['LinkDetection']> = ResolversObject<{
  type?: Resolver<ResolversTypes['LinkType'], ParentType, ContextType>;
  href?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstCharPos?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type TrackerDetectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackerDetection'] = ResolversParentTypes['TrackerDetection']> = ResolversObject<{
  type?: Resolver<ResolversTypes['TrackerType'], ParentType, ContextType>;
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  href?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstCharPos?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type LinkDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['LinkData'] = ResolversParentTypes['LinkData']> = ResolversObject<{
  results?: Resolver<Array<ResolversTypes['LinkDetection']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type TrackingDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackingData'] = ResolversParentTypes['TrackingData']> = ResolversObject<{
  results?: Resolver<Array<ResolversTypes['TrackerDetection']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type AnalysisDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['AnalysisData'] = ResolversParentTypes['AnalysisData']> = ResolversObject<{
  __resolveType: TypeResolveFn<'TrackingData' | 'LinkData', ParentType, ContextType>;
}>;

export type ResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['Result'] = ResolversParentTypes['Result']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  messageId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  data?: Resolver<ResolversTypes['AnalysisData'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type ResultsPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResultsPage'] = ResolversParentTypes['ResultsPage']> = ResolversObject<{
  results?: Resolver<Array<ResolversTypes['Result']>, ParentType, ContextType>;
  nextToken?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type MessagePreviewResolvers<ContextType = any, ParentType extends ResolversParentTypes['MessagePreview'] = ResolversParentTypes['MessagePreview']> = ResolversObject<{
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  snippet?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type MailboxQueriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['MailboxQueries'] = ResolversParentTypes['MailboxQueries']> = ResolversObject<{
  getMailboxSyncStatus?: Resolver<ResolversTypes['MailboxSyncStatus'], ParentType, ContextType>;
  getMailboxSyncStats?: Resolver<Maybe<ResolversTypes['JobCounters']>, ParentType, ContextType, RequireFields<MailboxQueriesGetMailboxSyncStatsArgs, 'jobId'>>;
  getResultsPage?: Resolver<ResolversTypes['ResultsPage'], ParentType, ContextType, RequireFields<MailboxQueriesGetResultsPageArgs, never>>;
  getMessagePreview?: Resolver<Maybe<ResolversTypes['MessagePreview']>, ParentType, ContextType, RequireFields<MailboxQueriesGetMessagePreviewArgs, 'messageId'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  mailbox?: Resolver<ResolversTypes['MailboxQueries'], ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  mailbox?: Resolver<ResolversTypes['MailboxMutations'], ParentType, ContextType>;
}>;

export type MailboxMutationsResolvers<ContextType = any, ParentType extends ResolversParentTypes['MailboxMutations'] = ResolversParentTypes['MailboxMutations']> = ResolversObject<{
  syncMailbox?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  MailboxSyncStatus?: MailboxSyncStatusResolvers<ContextType>;
  JobCounters?: JobCountersResolvers<ContextType>;
  JobStats?: JobStatsResolvers<ContextType>;
  LinkDetection?: LinkDetectionResolvers<ContextType>;
  TrackerDetection?: TrackerDetectionResolvers<ContextType>;
  LinkData?: LinkDataResolvers<ContextType>;
  TrackingData?: TrackingDataResolvers<ContextType>;
  AnalysisData?: AnalysisDataResolvers;
  Result?: ResultResolvers<ContextType>;
  ResultsPage?: ResultsPageResolvers<ContextType>;
  MessagePreview?: MessagePreviewResolvers<ContextType>;
  MailboxQueries?: MailboxQueriesResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MailboxMutations?: MailboxMutationsResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
