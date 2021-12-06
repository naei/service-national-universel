import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SortableJS from "sortablejs";
import API from "../../services/api";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useKnowledgeBaseData from "../../hooks/useKnowledgeBaseData";
import Loader from "../Loader";

const useIsActive = ({ slug }, onIsActive) => {
  const router = useRouter();

  const [active, setActive] = useState(false);
  useEffect(() => {
    setActive(slug === router.query?.slug);
  }, [router.query?.slug]);

  useEffect(() => {
    if (onIsActive) {
      if (active) {
        onIsActive(true);
      } else {
        onIsActive(false);
      }
    }
  }, [active]);
  return active;
};

const horizontalSpacing = 2;

const Branch = ({ section, level, onIsActive, position, parentId, onListChange, isDragging, onStartDrag }) => {
  const [open, setIsOpen] = useState(section.type === "root");

  const isActive = useIsActive(section, onIsActive);
  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  const onChildIsActive = (childIsActive) => {
    // open if child is active, don't close if child is not active
    if (childIsActive) setIsOpen(true);
    if (onIsActive) onIsActive(childIsActive);
  };

  const gridRef = useRef(null);
  const sortable = useRef(null);
  useEffect(() => {
    sortable.current = SortableJS.create(gridRef.current, { animation: 150, group: "shared", onEnd: onListChange, onStart: onStartDrag });
  }, []);

  let isDraft = JSON.stringify(section.children || []).includes("DRAFT") ? " 🔴 " : " ";

  const showOpen = isDragging || open;

  return (
    <div
      data-position={position}
      data-parentid={parentId || "root"}
      data-id={section._id || "root"}
      data-type="section"
      className={`flex flex-col ml-${level * horizontalSpacing}`}
    >
      <span className={` text-warmGray-500  max-w-full inline-block overflow-hidden overflow-ellipsis whitespace-nowrap ${isActive ? "font-bold" : ""}`}>
        <small className="text-trueGray-400 mr-1 w-3 inline-block cursor-pointer" onClick={() => setIsOpen(!open)}>
          {showOpen ? "\u25BC" : "\u25B6"}
        </small>
        <Link href={`/admin/knowledge-base/${section.slug || ""}`} passHref>
          {section.title ? (
            `${showOpen ? "📂" : "📁"}${isDraft}${section.title} (${section.children?.length || 0})`
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline -mt-2 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          )}
        </Link>
      </span>
      <div ref={gridRef} id={`child-container-${section._id || "root"}`} className={`flex flex-col ${!showOpen ? "hidden" : ""}`}>
        {section.children?.map((child) =>
          child.type === "section" ? (
            <Branch
              parentId={child.parentId}
              position={child.position}
              key={child._id}
              section={child}
              level={level + 1}
              isDragging={isDragging}
              onIsActive={onChildIsActive}
              onListChange={onListChange}
              onStartDrag={onStartDrag}
            />
          ) : (
            <Answer parentId={child.parentId} position={child.position} key={child._id} article={child} level={level + 1} onIsActive={onChildIsActive} />
          )
        )}
      </div>
    </div>
  );
};

const Answer = ({ article, level, onIsActive, position, parentId }) => {
  const isActive = useIsActive(article, onIsActive);
  const icon = article.status === "DRAFT" ? "📝 🔴 " : "📃 ";
  return (
    <Link key={article._id} href={`/admin/knowledge-base/${article.slug}`} passHref>
      <a
        data-position={position}
        data-parentid={parentId}
        data-id={article._id}
        href="#"
        className={`text-warmGray-500  overflow-hidden overflow-ellipsis whitespace-nowrap block ml-${level * horizontalSpacing} ${isActive ? "font-bold" : ""}`}
      >
        {`${icon}  ${article.title}`}
      </a>
    </Link>
  );
};

const findChildrenRecursive = async (section, allItems) => {
  const childrenContainer = section.querySelector(`#child-container-${section.dataset.id}`);
  for (const [index, child] of Object.entries([...childrenContainer.children])) {
    const updatedChild = {
      position: Number(index) + 1,
      parentId: section.dataset.id === "root" ? null : section.dataset.id,
      _id: child.dataset.id,
    };
    allItems.push(updatedChild);
    if (child.dataset.type === "section") findChildrenRecursive(child, allItems);
  }
};

const getReorderedTree = (root, flattenedData) => {
  const allItems = [];
  findChildrenRecursive(root, allItems);
  return allItems.filter((newItem) => {
    const originalItem = flattenedData.find((original) => original._id === newItem._id);
    return originalItem.position !== newItem.position || originalItem.parentId !== newItem.parentId;
  });
};

const KnowledgeBaseTree = ({ visible }) => {
  const { tree, flattenedData, mutate } = useKnowledgeBaseData();

  // reloadTreeKey to prevent error `Failed to execute 'removeChild' on 'Node'` from sortablejs after updating messy tree
  const [reloadTreeKey, setReloadeTreeKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const rootRef = useRef(null);
  const onStartDrag = () => setIsDragging(true);

  const onListChange = async () => {
    setIsSaving(true);
    setIsDragging(false);
    const body = getReorderedTree(rootRef.current.children[0], flattenedData);
    const response = await API.put({ path: "/support-center/knowledge-base/reorder", body });
    if (!response.ok) {
      setIsSaving(false);
      return toast.error("Désolé, une erreur est survenue. Veuillez recommencer !");
    }
    mutate(response);
    setIsDragging(false);
    setReloadeTreeKey((k) => k + 1);
    setIsSaving(false);
  };

  return (
    <aside className={`relative flex flex-col flex-grow-0 flex-shrink-0 border-r-2 shadow-lg z-10 resize-x p-2 overflow-hidden ${visible ? "w-80" : "w-0 hidden"}`}>
      {/* TODO find a way for tailwind to not filter margins from compiling,
       because things like `ml-${level}` are not compiled */}
      <div className="hidden ml-2 ml-3 ml-4 ml-5 ml-6 ml-7 ml-8 ml-9 ml-10 ml-11 ml-12 ml-13 ml-14 ml-15 ml-16"></div>
      <div ref={rootRef} key={reloadTreeKey} className="overflow-auto">
        <Branch section={tree} level={0} onListChange={onListChange} onStartDrag={onStartDrag} />
      </div>
      {!!isSaving && (
        <div className="absolute w-full h-full top-0 left-0 bg-gray-500 opacity-25 pointer-events-none">
          <Loader color="#bbbbbb" size={40} />
        </div>
      )}
    </aside>
  );
};

export default KnowledgeBaseTree;
