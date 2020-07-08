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
  userId: Scalars['String'];
  numMessagesSeen: Scalars['Int'];
  numMessagesDownloaded: Scalars['Int'];
  createdAt: Scalars['Int'];
  updatedAt: Scalars['Int'];
  isCompleted: Scalars['Boolean'];
  status: JobStatus;
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
  results: Array<LinkDetection>;
};

export type AnalysisData = TrackingData | LinkData;

export type Result = {
  __typename?: 'Result';
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
  getResultsPage: ResultsPage;
  getMessagePreview?: Maybe<MessagePreview>;
  syncMailbox: Scalars['Boolean'];
};


export type MailboxQueriesGetResultsPageArgs = {
  token?: Maybe<Scalars['Int']>;
};


export type MailboxQueriesGetMessagePreviewArgs = {
  messageId: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  mailbox: MailboxQueries;
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
  String: ResolverTypeWrapper<Scalars['String']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  JobStatus: JobStatus;
  LinkDetection: ResolverTypeWrapper<LinkDetection>;
  LinkType: LinkType;
  LinkData: ResolverTypeWrapper<LinkData>;
  TrackingData: ResolverTypeWrapper<TrackingData>;
  AnalysisData: ResolversTypes['TrackingData'] | ResolversTypes['LinkData'];
  Result: ResolverTypeWrapper<Omit<Result, 'data'> & { data: ResolversTypes['AnalysisData'] }>;
  ResultsPage: ResolverTypeWrapper<ResultsPage>;
  MessagePreview: ResolverTypeWrapper<MessagePreview>;
  MailboxQueries: ResolverTypeWrapper<MailboxQueries>;
  Query: ResolverTypeWrapper<{}>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  MailboxSyncStatus: MailboxSyncStatus;
  String: Scalars['String'];
  Int: Scalars['Int'];
  Boolean: Scalars['Boolean'];
  LinkDetection: LinkDetection;
  LinkData: LinkData;
  TrackingData: TrackingData;
  AnalysisData: ResolversParentTypes['TrackingData'] | ResolversParentTypes['LinkData'];
  Result: Omit<Result, 'data'> & { data: ResolversParentTypes['AnalysisData'] };
  ResultsPage: ResultsPage;
  MessagePreview: MessagePreview;
  MailboxQueries: MailboxQueries;
  Query: {};
}>;

export type MailboxSyncStatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['MailboxSyncStatus'] = ResolversParentTypes['MailboxSyncStatus']> = ResolversObject<{
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  numMessagesSeen?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numMessagesDownloaded?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isCompleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['JobStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type LinkDetectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['LinkDetection'] = ResolversParentTypes['LinkDetection']> = ResolversObject<{
  type?: Resolver<ResolversTypes['LinkType'], ParentType, ContextType>;
  href?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstCharPos?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type LinkDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['LinkData'] = ResolversParentTypes['LinkData']> = ResolversObject<{
  results?: Resolver<Array<ResolversTypes['LinkDetection']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type TrackingDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackingData'] = ResolversParentTypes['TrackingData']> = ResolversObject<{
  results?: Resolver<Array<ResolversTypes['LinkDetection']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type AnalysisDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['AnalysisData'] = ResolversParentTypes['AnalysisData']> = ResolversObject<{
  __resolveType: TypeResolveFn<'TrackingData' | 'LinkData', ParentType, ContextType>;
}>;

export type ResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['Result'] = ResolversParentTypes['Result']> = ResolversObject<{
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
  getResultsPage?: Resolver<ResolversTypes['ResultsPage'], ParentType, ContextType, RequireFields<MailboxQueriesGetResultsPageArgs, never>>;
  getMessagePreview?: Resolver<Maybe<ResolversTypes['MessagePreview']>, ParentType, ContextType, RequireFields<MailboxQueriesGetMessagePreviewArgs, 'messageId'>>;
  syncMailbox?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  mailbox?: Resolver<ResolversTypes['MailboxQueries'], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  MailboxSyncStatus?: MailboxSyncStatusResolvers<ContextType>;
  LinkDetection?: LinkDetectionResolvers<ContextType>;
  LinkData?: LinkDataResolvers<ContextType>;
  TrackingData?: TrackingDataResolvers<ContextType>;
  AnalysisData?: AnalysisDataResolvers;
  Result?: ResultResolvers<ContextType>;
  ResultsPage?: ResultsPageResolvers<ContextType>;
  MessagePreview?: MessagePreviewResolvers<ContextType>;
  MailboxQueries?: MailboxQueriesResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
